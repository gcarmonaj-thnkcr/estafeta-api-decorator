import express from "express";
import cors from "cors";
import serverless from "serverless-http";

let app = express();
app.use(cors());

let port = process.env.PORT || 5000;
const router = express.Router();
const data = require('./db.json');

router.get("/lifetimes", function(req, res){
    res.json ({
        statusCode: 200,
        body: JSON.stringify(data.items),
      });
});

router.get("/pdv-service", function(req, res){
    res.json ({
        statusCode: 200,
        body: JSON.stringify(data.pdvService),
      });
});

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);