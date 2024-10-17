"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.generateToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var seed = "Thinkcare24";
var generateToken = function (clientId, clientSecret) {
    var payload = {
        clientId: clientId,
        clientSecret: clientSecret
    };
    var token = jsonwebtoken_1.default.sign(payload, seed, { expiresIn: '24h' });
    return token;
};
exports.generateToken = generateToken;
var validateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Token no proporcionado o formato inválido.' });
    }
    var token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, seed, function (err, decoded) {
        if (err) {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        var clientId = decoded.clientId, clientSecret = decoded.clientSecret;
        console.log(clientId, clientSecret);
        next();
    });
};
exports.validateToken = validateToken;
