import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import data from './mock_values.json' assert { type: 'json'}
import { apiRoot } from "./bCommercetools/client.js";

const app = express();
app.use(cors());

const port = process.env.PORT || 9000;
const router = express.Router();

router.get("/", function(_, res) {
  res.sendStatus(200)
})

/// authenticacion por AUTH 2.0

router.get("/lifetimes", function(req, res){
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

    res.json ({
        statusCode: 200,
        body: data.items,
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
