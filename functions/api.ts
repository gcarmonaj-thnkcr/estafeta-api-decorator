import express, { Request, Response } from "express";
import serverless from "serverless-http";
import cors from "cors";
// import data from './mock_values.json' assert { type: 'json'}
import { generateToken, validateToken } from "./jsonToken/token";
import pdvRouter from './controllers/pdv/index'
import lifetTimeRouter from './controllers/lifetimes/index'
import waybillRouter from './controllers/waybills/index'
import ordersRouter from './controllers/orders/index'
import loginRouter from './controllers/login/index'

const app = express();

app.use(cors());
app.use(express.json())


app.use("/.netlify/functions/api",pdvRouter)
app.use("/.netlify/functions/api", lifetTimeRouter)
app.use("/.netlify/functions/api", waybillRouter)
app.use("/.netlify/functions/api", ordersRouter)
app.use("/.netlify/functions/api", loginRouter)

const port = process.env.PORT || 9000;

export const handler = serverless(app);

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})



