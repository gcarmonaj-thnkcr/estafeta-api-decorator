import { Router, Request, Response } from "express";
import { generateToken } from "../../jsonToken/token";

const router = Router()

router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [clientId, clientSecret] = credentials.split(':');

  if (!clientId || !clientSecret) {
    return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
  }

  if (clientId != "wjg14gn3zqm34q8srm2htj" || clientSecret != "gu1vr46nc4pl87") {
    return res.status(401).send({ message: "Credenciales no validas" })
  }
  
  const token = generateToken(clientId, clientSecret)

  return res.status(201).send({
    access_token: token,  
    token
  })
})

export default router
