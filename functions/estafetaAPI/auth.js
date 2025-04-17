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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", { value: true });
exports.authToken = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let tokensCreateds = new Map();
const urlEstafetaQA = "https://apiqa.estafeta.com:8443/auth/oauth/v2/token";
const urlEstafetProd = "https://api.estafeta.com/auth/oauth/v2/token";
const urlMicrosoft = "https://login.microsoftonline.com/2a3f6c70-006d-4bba-9bd9-2c200073ca62/oauth2/v2.0/token";
const isProduction = (_a = process.env.ISPRODUCTION) !== null && _a !== void 0 ? _a : "false";
console.log(isProduction);
const authToken = (_a) => __awaiter(void 0, [_a], void 0, function* ({ type }) { return yield validateToken({ type }); });
exports.authToken = authToken;
const Keys = {
    'quote': {
        clientId: (_b = process.env.ClientIdQuote) !== null && _b !== void 0 ? _b : "",
        clientSecret: (_c = process.env.ClientSecretQuote) !== null && _c !== void 0 ? _c : "",
        url: isProduction == "true" ? urlEstafetProd : urlEstafetaQA,
    },
    'quoteInternacional': {
        clientId: (_d = process.env.ClientIdQuoteInternacional) !== null && _d !== void 0 ? _d : "",
        clientSecret: (_e = process.env.ClientSecretQuoteInternacional) !== null && _e !== void 0 ? _e : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
    'purchaseOrder': {
        clientId: (_f = process.env.ClientIdPurchase) !== null && _f !== void 0 ? _f : "",
        clientSecret: (_g = process.env.ClientSecretPurchase) !== null && _g !== void 0 ? _g : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
    'newPickUp': {
        clientId: (_h = process.env.ClientIdPickUp) !== null && _h !== void 0 ? _h : "",
        clientSecret: (_j = process.env.ClientSecredPickUp) !== null && _j !== void 0 ? _j : "",
        url: urlMicrosoft,
        scope: "https://graph.microsoft.com/.default"
    },
    'folios': {
        clientId: (_k = process.env.ClientIdFolios) !== null && _k !== void 0 ? _k : "",
        clientSecret: (_l = process.env.ClientSecretFolios) !== null && _l !== void 0 ? _l : "",
        url: isProduction == "true" ? urlEstafetProd : urlMicrosoft,
        scope: isProduction == "true" ? "execute" : "https://graph.microsoft.com/.default"
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
        const { clientId, clientSecret, url, scope } = Keys[type];
        const creationToken = yield createToken(clientId, clientSecret, url, scope);
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
        console.error("error token", err);
        return {};
    }
});
