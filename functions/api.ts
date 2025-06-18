import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import morgan from "morgan";
import * as dotenv from "dotenv";
// import data from './mock_values.json' assert { type: 'json'}
import pdvRouter from "./controllers/pdv/index";
import lifetTimeRouter from "./controllers/lifetimes/index";
import waybillRouter from "./controllers/waybills/index";
import ordersRouter from "./controllers/orders/index";
import loginRouter from "./controllers/login/index";
import webhookRouter from "./controllers/webhook/index";
import quoteRouter from "./controllers/quote/index";
import reprocessRouter from "./controllers/reprocess/index";
import reportRouter from "./controllers/report/index";
import customObjects from "./controllers/customObjects/index";
import { validateStatus } from "./jobs/validateStatus";

const app = express();
dotenv.config();
validateStatus.start();

app.use(morgan("combined"));
app.use(cors());
app.use(express.json());

app.use("/.netlify/functions/api", webhookRouter);
app.use("/.netlify/functions/api", pdvRouter);
app.use("/.netlify/functions/api", lifetTimeRouter);
app.use("/.netlify/functions/api", waybillRouter);
app.use("/.netlify/functions/api", ordersRouter);
app.use("/.netlify/functions/api", loginRouter);
app.use("/.netlify/functions/api", quoteRouter);
app.use("/.netlify/functions/api", reprocessRouter);
app.use("/.netlify/functions/api", reportRouter);
app.use("/.netlify/functions/api", customObjects);

const port = process.env.PORT || 9000;

export const handler = async (event: any, context: any) => {
  return await serverless(app)(event, context);
};

app.listen(port, () => {
  console.log("Server listenning on port" + port);
});
