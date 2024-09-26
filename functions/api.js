import express from "express";
import cors from "cors";
import serverless from "serverless-http";
//import data from './mock_values.json' assert { type: 'json'}
import { apiRoot } from "../commercetools/client.js";
import { checkDate } from "./validateDate/validate.js";
import { generateToken, validateToken } from "../jsonToken/token.js";

const orderstoNotify = {}
const app = express();
app.use(cors());

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

router.get("/pdv-services", async function(req, res){
    const qr = req.headers.qr
    /// Obtener el QR de una variable en el header
    /// Obtener orden de CT con query de QR
    /// Generar la estructura de data.pdvService

    console.log(qr)
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
    
    const responseObject = {
      "pdvService": {
        "storeServiceOrder": "999-999999",
        "PurchaseOrder": searchOrder.body.orderNumber,
        "waybill": "1234567890123456789012",
        "idcaStoreClient": 1234567890,
        "idcaServiceWarranty": "123",
        "idcaServiceModality": "123",
        "isPudo": "0",
        "isPackage": "0",
        "itemLength": "50",
        "itemHeight": "50",
        "itemWidth": "50",
        "itemVolumen": "50",
        "isItemDimensionsExceeded": "0",
        "itemWeight": "20",
        "isItemWeightExceeded": "0",
        "statusServiceOrder": "Registrado",
        "QRCode": "1233412444563452342134214323414", // Vacio
        "QRCodeMD5": "1233412444563452342134214323414",
        "consultaId": "99999999", /// Revisarlo con Memo
        "createdDate": "2021-02-24",
        "availabledDate": "2021-03-01/2021-03-06",
        "sender": {
            "eMailClient": "guillermo.valerio@estafeta.com",
            "isPudo": "0",
            "EquivalentCode": "123",
            "TyoeLocationName": "Nombre del Pudo",
            "SpaceOwnerName": "Tipo de pudo",
            "isSender": "0",
            "CompleteName": "JUAN FRANCISCO VALERIO GONZÁLEZ",
            "zipCode": "99999",
            "roadTypeCode": "9999",
            "roadTypeName": "Avenida",
            "street": "Margarita Maza de Juárez",
            "externalNum": "Entrada Rada Andador 3 Edificio 100",
            "indoreInformation": "departamento 17-B",
            "settlementTypeCode": "999",
            "settlementTypeName": "Unidad Habitacional",
            "settlementName": "La Patera Vallejo",
            "twnshipCode": "999",
            "twnshipName": "Gustavo A Madero",
            "stateCode": "999",
            "stateName": "CDMX",
            "countryCode": "999",
            "countryCodeAlfa3": "MEX",
            "countryName": "México",
            "betweenRoadName1": "av de los cien metros",
            "betweenRoadName2": "y calzada vallejo",
            "AddressReference": "Esta entre el Edificio 97 y 102",
            "CountryCodePhone": "999",
            "LandlinePhone": "5555555555",
            "CellPhone": "5555555555",
            "ContacteMail": "micorreopersonal@dominio.com",
            "Latitude": 99999.99,
            "Longitude": 99999.99,
            "IsActive": "True",
            "recipient": {
                "eMailClient": "guillermo.valerio@estafeta.com",
                "isPudo": "0",
                "EquivalentCode": "123",
                "TyoeLocationName": "Nombre del Pudo",
                "SpaceOwnerName": "Tipo de pudo",
                "isSender": "0",
                "CompleteName": "JUAN FRANCISCO VALERIO GONZÁLEZ",
                "zipCode": "99999",
                "roadTypeCode": "9999",
                "roadTypeName": "Avenida",
                "street": "Margarita Maza de Juárez",
                "externalNum": "Entrada Rada Andador 3 Edificio 100",
                "indoreInformation": "departamento 17-B",
                "settlementTypeCode": "999",
                "settlementTypeName": "Unidad Habitacional",
                "settlementName": "La Patera Vallejo",
                "twnshipCode": "999",
                "twnshipName": "Gustavo A Madero",
                "stateCode": "999",
                "stateName": "CDMX",
                "countryCode": "999",
                "countryCodeAlfa3": "MEX",
                "countryName": "México",
                "betweenRoadName1": "av de los cien metros",
                "betweenRoadName2": "y calzada vallejo",
                "AddressReference": "Esta entre el Edificio 97 y 102",
                "CountryCodePhone": "999",
                "LandlinePhone": "5555555555",
                "CellPhone": "5555555555",
                "ContacteMail": "micorreopersonal@dominio.com",
                "Latitude": 99999.99,
                "Longitude": 99999.99,
                "IsActive": "True"
            }
        }
      }
    }


    res.json ({
      statusCode: 200,
      body: responseObject,
    });
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

  return res.status(201).send({token})
})

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})
