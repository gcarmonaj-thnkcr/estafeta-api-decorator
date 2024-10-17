import app from './index'
import serverless from "serverless-http";

const port = process.env.PORT || 9000;

export const handler = serverless(app);

