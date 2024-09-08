import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import data from './mock_values.json' assert { type: 'json'}

let app = express();
app.use(cors());

let port = process.env.PORT || 5000;
const router = express.Router();

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
app.listen(port)