import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import data from './mock_values.json' assert { type: 'json'}

let app = express();
app.use(cors());

let port = process.env.PORT || 9000;
const router = express.Router();

router.get("/lifetimes/:client_id", function(req, res){
    console.log(req.params.client_id)
    res.json ({
        statusCode: 200,
        body: data.items,
      });
});

router.get("/pdv-services", function(req, res){
    console.log(req.query.qr)
    res.json ({
        statusCode: 200,
        body: data.pdvService,
      });
});

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);
app.listen(port)