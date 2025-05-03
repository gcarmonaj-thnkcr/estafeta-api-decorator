import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const seed = "Thinkcare24"

export const generateToken = (clientId: string, clientSecret: string) => {
  const payload = {
    clientId,
    clientSecret
  } 

  const token = jwt.sign(payload, seed, { expiresIn: '24h' })

  return token
}

export const validateToken = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Token no proporcionado o formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, seed, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    const { clientId, clientSecret } = decoded

    next();
  });

}

export const validateTokenServerless = (authHeader: string | undefined): { valid: boolean; message?: string } => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, message: 'Token no proporcionado o formato inválido.' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, seed);
    return { valid: true };
  } catch (err) {
    return { valid: false, message: 'Token inválido.' };
  }
};
