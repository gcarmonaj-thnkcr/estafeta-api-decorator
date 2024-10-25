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
                Cookie: 'BIGipServerCaildad_8443=!WuZyHrCif8e/oHAeQuK4+sWx1d8MfXw6kMKwes1XaUfnA1qegtN97nV/TkPw6P8sisaPvspWFcz1IX8=',
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
