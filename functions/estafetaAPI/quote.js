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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCotizacion = handleCotizacion;
exports.handleCotizacionInternacional = handleCotizacionInternacional;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("./auth");
function handleCotizacion(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = body;
        let dataCookie = JSON.stringify(data);
        const token = yield (0, auth_1.authToken)({ type: 'quote' });
        const config = {
            method: 'post',
            url: 'https://wscotizadorqa.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
            headers: {
                apikey: 'l7beefb34b43bc44ef8d318541258df87c',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            data: JSON.stringify(data),
        };
        try {
            const response = yield axios_1.default.request(config);
            return response.data;
        }
        catch (error) {
            console.log(token, "TOKEN Cotizador");
            console.log(data, "MARIO");
            console.log('Error: iD', process.env.ClientIdQuote);
            console.log('Error: Secret', process.env.ClientSecretQuote);
            console.error('Error: Cotizacion', error.response ? error.response.data : error.message);
            throw error;
        }
    });
}
function handleCotizacionInternacional(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = body;
        const token = yield (0, auth_1.authToken)({ type: 'quoteInternacional' });
        console.log(data);
        const config = {
            method: 'post',
            url: 'https://apimwscotizadorqa.estafeta.com/Cotizacion/rest/Cotizador/InternationalQuotation?SALES_ORGANIZATION&CUSTOMER',
            headers: {
                apikey: '782b4f8f93934ab28e4c4ab33ca2f833',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            data: JSON.stringify(data),
        };
        try {
            console.log("Config", config);
            const response = yield axios_1.default.request(config);
            console.log("Response international:", response.data);
            return response.data;
        }
        catch (error) {
            console.log(token, "TOKEN int");
            console.log(data, "MARIO int");
            console.log('Error: iD', process.env.ClientIdQuoteInternacional);
            console.log('Error: Secret', process.env.ClientSecretQuoteInternacional);
            console.error('Error: Cotizacion', error.message);
            return error.message;
        }
    });
}
