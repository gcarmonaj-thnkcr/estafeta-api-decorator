import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import data from './mock_values.json' assert { type: 'json'}
import { apiRoot } from "../commercetools/client.js";
import { checkDate } from "./validateDate/validate.js";
import { generateToken, validateToken } from "../jsonToken/token.js";
import { FormaterDate } from "../utils/formaterDate.js";

const orderstoNotify = {}
const app = express();
app.use(cors());
app.use(express.json())

const port = process.env.PORT || 9000;
const router = express.Router();

router.get("/", function(_, res) {
  res.sendStatus(200)
})

const addObject = async (index, order, days) => {
  if(!orderstoNotify[index]){
    orderstoNotify[index] = []
  }
  try{ 
    const customer = await apiRoot.customers().withId({ID: order.customerId}).get().execute()
    if(!customer.statusCode || customer.statusCode >= 300) return

    const products = []
    for(const item of order.lineItems){
      products.push(`(${item.quantity})${item.name["es-MX"]}`) 
    }
    const date = new Date(order.createdAt)
    date.setDate(date.getDate() + 426)
    
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };

    // Formatear la fecha 
    const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
    
    orderstoNotify[index].push({
      emailClient: customer.body.email,
      clientName: customer.body.firstName + customer.body.lastName + customer.body.middleName,
      folios: products.join(","),
      expirationDate: fechaFormateada,
      expirationDays: days
    });
  } catch(err){
    return 
  }
}

const validateWaybillRequest = (waybillService) => {
  const isValid = waybillService.every(service => 
    typeof service.storePortalOrder === 'string' &&
    typeof service.storeFolioOrder === 'string' &&
    typeof service.eMailClient === 'string' &&
    typeof service.serviceWarranty === 'string' &&
    typeof service.serviceModality === 'string' &&
    typeof service.waybill === 'string' &&
    typeof service.statusFolioOrder === 'string' &&
    typeof service.usedDate === 'string' &&
    typeof service.IsGenerator === 'boolean'
  );

  return isValid;
}

/// authenticacion por AUTH 2.0

router.get("/lifetimes", validateToken, async function(req, res){
    console.log(req.params.client_id)
    /// Traer ordenes de tipo Combo
    /// Verificar que ordenes caen en los periodos de notificación:
    /// 1. 3 meses - antiguedad de la orden sea de 12M
    /// 2. 1 mese - antiguedad de la orden sea de 13M
    /// 3. 15 días - antiguedad de la orden sea de 13M y 15d
    /// 4. 7 días - antiguedad de la orden sea de 13M y 21d
    /// 5. 1 día antiguedad de la orden sea de 13M y 29d
    /// Obtener datos del cliente
    /// armas la estructura de coleccion (data.items)
  //
    const orders = await apiRoot.orders().get({
      queryArgs: {
        limit: 500,
        sort: "createdAt desc"
      }
    }).execute()
    
    if(orders.body.results.length <= 0) return res.sendStatus(204)

    
    const ordersCombo = orders.body.results.filter(order => order.lineItems.some(item => item.variant.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA")))
    
    for(const order of ordersCombo) {
      const daysDif = checkDate(order.createdAt)
      switch(daysDif) {
        case 365: 
          await addObject(daysDif, order, 90)          
        break;
        case 395: 
          await addObject(daysDif, order, 30)          
        break;
        case 411: 
          await addObject(daysDif, 15)          
        break; 
        case 417: 
          await addObject(daysDif, order, 7)          
        break;
        case 424: 
          await addObject(daysDif, order, 1)          
        break;
      }
    }    

    res.json ({
        statusCode: 200,
        body: orderstoNotify,
      });
});

router.get("/pdv-services", validateToken, async function(req, res){
    const qr = req.headers.qr
    /// Obtener el QR de una variable en el header
    /// Obtener orden de CT con query de QR
    /// Generar la estructura de data.pdvService
    if(!qr || qr == '') return res.sendStatus(404)
    const order = await apiRoot.orders().search().post({
      body: {
        query: {
          fullText: {
            field: "custom.services",
            value: qr,
            customType: "StringType"
          }
        }
      }
    }).execute()
    
    if(order.body.hits.length <= 0) return res.sendStatus(404)
    
    const searchOrder = await apiRoot.orders().withId({ID: order.body.hits[0].id}).get().execute()
    const customObject = JSON.parse(searchOrder.body.custom.fields["services"])
    const servicesFind = customObject[searchOrder.body.lineItems[0].id].find(item => item.QR == qr)
    console.log(servicesFind)    
    const { origin, destination, recoleccion } = servicesFind.address
    
    const responseObject = {
      "pdvService": {
        "storeServiceOrder": "999-999999",
        "PurchaseOrder": searchOrder.body.orderNumber ?? searchOrder.body.custom.fields["pickupNumber"],
        "waybill": servicesFind?.guide ?? "",
        "idcaStoreClient": 1234567890,
        "idcaServiceWarranty": "123",
        "idcaServiceModality": "123",
        "isPudo": servicesFind.isPudo ? "1" : "0",
        "isPackage": servicesFind.isPackage? "1" : "0",
        "itemLength": servicesFind?.itemLength ?? "",
        "itemHeight": servicesFind?.itemHeight ?? "",
        "itemWidth": servicesFind?.itemWidth ?? "",
        "itemVolumen": servicesFind?.itemVolumen ?? "",
        "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
        "itemWeight": servicesFind?.itemWeight ?? "",
        "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
        "statusServiceOrder": "Registrado",
        "QRCode": "", // Vacio
        "QRCodeMD5": servicesFind.QR,
        "consultaId": "99999999", /// Revisarlo con Memo
        "createdDate": FormaterDate(searchOrder.body.createdAt, false),
        "availabledDate": `${FormaterDate(searchOrder.body.createdAt)} - ${FormaterDate(searchOrder.body.createdAt)}`,
        "sender": {
            "eMailClient": origin.email,
            "isPudo": "0",
            "EquivalentCode": "123",
            "TyoeLocationName": "Nombre del Pudo",
            "SpaceOwnerName": "Tipo de pudo",
            "isSender": "0",
            "CompleteName": origin.firstName+" " + origin.lastName+ " " + origin?.middleName ?? "",
            "zipCode": origin.postalCode,
            "roadTypeCode": "9999",
            "roadTypeName": origin.road,
            "street": origin.street,
            "externalNum": origin.exteriorNumber,
            "indoreInformation": origin?.interiorNumber ?? "",
            "settlementTypeCode": "999",
            "settlementTypeName": origin.settlement,
            "settlementName": "La Patera Vallejo",
            "twnshipCode": "999",
            "twnshipName": "Gustavo A Madero",
            "stateCode": origin.postalCode,
            "stateName": origin.state,
            "countryCode": "999",
            "countryCodeAlfa3": "MEX",
            "countryName": origin.country,
            "betweenRoadName1": origin?.optionalAddress1 ?? "",
            "betweenRoadName2": "y"+" "+origin?.optionalAddress2 ?? "",
            "AddressReference": origin?.reference ?? "",
            "CountryCodePhone": "999",
            "LandlinePhone": origin.phone1,
            "CellPhone": origin?.phon2 ?? "",
            "ContacteMail": origin.email,
            "Latitude": 99999.99,
            "Longitude": 99999.99,
            "IsActive": "True",
            "recipient": {
              "eMailClient": destination.email,
              "isPudo": "0",
              "EquivalentCode": "123",
              "TyoeLocationName": "Nombre del Pudo",
              "SpaceOwnerName": "Tipo de pudo",
              "isSender": "0",
              "CompleteName": destination.firstName+" " + destination.lastName+ " " + destination?.middleName ?? "",
              "zipCode": destination.postalCode,
              "roadTypeCode": "9999",
              "roadTypeName": destination.road,
              "street": destination.street,
              "externalNum": destination.exteriorNumber,
              "indoreInformation": destination?.interiorNumber ?? "",
              "settlementTypeCode": "999",
              "settlementTypeName": destination.settlement,
              "settlementName": "La Patera Vallejo",
              "twnshipCode": "999",
              "twnshipName": "Gustavo A Madero",
              "stateCode": destination.postalCode,
              "stateName": destination.state,
              "countryCode": "999",
              "countryCodeAlfa3": "MEX",
              "countryName": destination.country,
              "betweenRoadName1": destination?.optionalAddress1 ?? "",
              "betweenRoadName2": "y"+" "+destination?.optionalAddress2 ?? "",
              "AddressReference": destination?.reference ?? "",
              "CountryCodePhone": "999",
              "LandlinePhone": destination.phone1,
              "CellPhone": destination?.phon2 ?? "",
              "ContacteMail": destination.email,
              "Latitude": 99999.99,
              "Longitude": 99999.99,
              "IsActive": "True",
            }
        }
      }
    }

    res.json ({
      statusCode: 200,
      body: responseObject,
    });
});

router.post("/waybills", async function(req, res){
  const { WaybillService } = req.body;
  
  const isValid = validateWaybillRequest(WaybillService);

  if (!isValid) {
    return res.status(400).send({ message: 'Invalid WaybillService format.' });
  }
  
  /// Extraer la guia disponible de las ordenes de combo
  /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
  /// Crear la estructura de data.WaybillService

  res.json (data.WaybillService);
});

router.put("/waybills", async function(req, res){
  const { AsignWaybillOrder } = req.body;
  
  const isValid = validateWaybillRequest(AsignWaybillOrder);

  if (!isValid) {
    return res.status(400).send({ message: 'Invalid WaybillService format.' });
  }

  /// Cambiar el estado de la guia 
  /// Devolverla a la orden original
  /// Crear la estructura de data.WaybillStatusChanged

  res.json (data.WaybillStatusChanged);
});

router.post("/login", async function(req, res) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [clientId, clientSecret] = credentials.split(':');

  if (!clientId || !clientSecret) {
    return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
  }

  if (clientId != "wjg14gn3zqm34q8srm2htj" || clientSecret != "gu1vr46nc4pl87") {
    return res.status(401).send({ message: "Credenciales no validas" })
  }
  
  const token = generateToken(clientId, clientSecret)

  return res.status(201).send({
    access_token: token,  
    token
  })
})

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})
