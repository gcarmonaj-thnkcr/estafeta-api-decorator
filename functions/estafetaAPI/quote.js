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
            url: 'https://wscotizador.estafeta.com/Cotizacion/rest/Cotizador/Cotizacion',
            headers: {
                apikey: 'l78539fd322ef546f1885be202a6535157',
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
            url: 'https://apimwscotizador.estafeta.com/Cotizacion/rest/Cotizador/InternationalQuotation?SALES_ORGANIZATION&CUSTOMER',
            headers: {
                apikey: 'l7beefb34b43bc44ef8d318541258df87c',
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
            console.log('Error: iD', process.env.ClientIdQuote);
            console.log('Error: Secret', process.env.ClientSecretQuot);
            console.error('Error: Cotizacion', error.message);
            return error.message;
        }
    });
}
