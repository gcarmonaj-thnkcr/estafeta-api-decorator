import express from "express";
import cors from "cors";
import serverless from "serverless-http";
//import data from './mock_values.json' assert { type: 'json'}
import { apiRoot } from "../commercetools/client.js";
import { checkDate } from "./validateDate/validate.js";

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
    console.log(order.customerId)
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
    console.log(err.message)
    return 
  }
}

/// authenticacion por AUTH 2.0

router.get("/lifetimes", async function(req, res){
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
      res.json ({
          statusCode: 200,
          body: order.body.hits[0].id,
        });
});

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})
