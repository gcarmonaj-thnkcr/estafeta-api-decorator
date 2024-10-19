"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = require("../../jsonToken/token");
const router = (0, express_1.Router)();
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
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
        return res.status(401).send({ message: "Credenciales no validas" });
    }
    const token = (0, token_1.generateToken)(clientId, clientSecret);
    return res.status(201).send({
        access_token: token,
        token
    });
}));
exports.default = router;
