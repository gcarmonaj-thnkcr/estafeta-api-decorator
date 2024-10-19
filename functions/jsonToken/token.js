"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const seed = "Thinkcare24";
const generateToken = (clientId, clientSecret) => {
    const payload = {
        clientId,
        clientSecret
    };
    const token = jsonwebtoken_1.default.sign(payload, seed, { expiresIn: '24h' });
    return token;
};
exports.generateToken = generateToken;
const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Token no proporcionado o formato inválido.' });
    }
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, seed, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        const { clientId, clientSecret } = decoded;
        next();
    });
};
exports.validateToken = validateToken;
