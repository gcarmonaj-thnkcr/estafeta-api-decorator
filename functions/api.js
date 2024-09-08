import express from "express";
import cors from "cors";
import serverless from "serverless-http";

let app = express();
app.use(cors());

let port = process.env.PORT || 5000;
const router = express.Router();

router.get("/lifetimes", function(req, res){
    res.json({message: "Hello from server"});
});

router.get("/pdv-service", function(req, res){
    res.json({message: "Hello from server"});
});

app.use('/.netlify/functions/api', router);
export const handler = serverless(app);