import jwt from 'jsonwebtoken'

const seed = "Thinkcare24"

export const generateToken = (clientId, clientSecret) => {
  const payload = {
    clientId,
    clientSecret
  } 

  const token = jwt.sign(payload, seed, { expiresIn: '1h' })

  return token
}

export const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Token no proporcionado o formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, seed, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    
    const { clientId, clientSecret } = decoded
    console.log(clientId, clientSecret)

    next();
  });

}

