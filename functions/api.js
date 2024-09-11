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

router.get("/lifetimes", function(req, res){
    console.log(req.params.client_id)
    res.json ({
        statusCode: 200,
        body: data.items,
      });
});

router.get("/pdv-services", async function(req, res){
    // const qr = req.params.qr
    // const qrh = req.headers.qr
    // const order = await apiRoot.orders().search().post({
    //   body: {
    //     query: {
    //       fullText: {
    //         field: "custom.services",
    //         value: qr,
    //         customType: "StringType"
    //       }
    //     }
    //   }
    // }).execute()
    
    // if(order.body.hits.length <= 0) return res.sendStatus(404)
    res.json ({
        statusCode: 200,
        body: data.pdvService, //order.body.hits[0].id,
      });
});

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})
