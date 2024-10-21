"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.authToken = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let tokensCreateds = new Map();
const urlMicrosoft = "https://login.microsoftonline.com/2a3f6c70-006d-4bba-9bd9-2c200073ca62/oauth2/v2.0/token";
const authToken = (_a) => __awaiter(void 0, [_a], void 0, function* ({ type }) { return yield validateToken({ type }); });
exports.authToken = authToken;
const Keys = {
    'purchaseOrder': {
        clientId: (_a = process.env.ClientIdPurchase) !== null && _a !== void 0 ? _a : "",
        clientSecret: (_b = process.env.ClientSecretPurchase) !== null && _b !== void 0 ? _b : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
    'newPickUp': {
        clientId: (_c = process.env.ClientIdPickUp) !== null && _c !== void 0 ? _c : "",
        clientSecret: (_d = process.env.ClientSecredPickUp) !== null && _d !== void 0 ? _d : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
    'folios': {
        clientId: (_e = process.env.ClientIdFolios) !== null && _e !== void 0 ? _e : "",
        clientSecret: (_f = process.env.ClientSecretFolios) !== null && _f !== void 0 ? _f : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
};
const validateToken = (_a) => __awaiter(void 0, [_a], void 0, function* ({ type }) {
    const token = tokensCreateds.get(type);
    if (!token) {
        const { clientId, clientSecret, url, scope } = Keys[type];
        console.log(clientId, clientSecret);
        const creationToken = yield createToken(clientId, clientSecret, url, scope);
        tokensCreateds.set(type, creationToken);
        return creationToken.access_token;
    }
    const createdAt = new Date(token.created_at);
    const expiresInMilliseconds = token.expires_in * 1000;
    const expirationDate = new Date(createdAt.getTime() + expiresInMilliseconds);
    const currentDate = new Date();
    if (currentDate >= expirationDate) {
        const { clientId, clientSecret, url } = Keys[type];
        const creationToken = yield createToken(clientId, clientSecret, url);
        tokensCreateds.set(type, creationToken);
        return creationToken.access_token;
    }
    else {
        return token.access_token;
    }
});
const createToken = (clientId, clientSecret, url, scope) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const auth = btoa(`${clientId}:${clientSecret}`);
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            scope: !scope ? "execute" : scope,
        });
        const request = yield axios_1.default.post(url, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            }
        });
        const token = Object.assign(Object.assign({}, request.data), { created_at: new Date() });
        if (!token)
            return {};
        return token;
    }
    catch (err) {
        console.log("error token", err);
        return {};
    }
});
