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
exports.CreateFolios = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("./auth");
const CreateFolios = (quantityFolios) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield (0, auth_1.authToken)({ type: 'folios' });
    let data = JSON.stringify({
        "applicationName": "TiendaEstafeta",
        "validityTime": "24", // dado por horas
        "format": "TDA-%06d", /// fiexd prefix Q3SQR
        "count": quantityFolios
    });
    const config = {
        method: 'post',
        url: 'https://wsbotrastreo.estafeta.com/Folios_IS/rest/FoliosManagement/CreateFolio',
        headers: {
            'apikey': 'l7f498410411fb4b23b62c1a78abf60200',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        data: data
    };
    try {
        const response = yield axios_1.default.request(config);
        debugger;
        return {
            data: response.data,
            message: undefined,
        };
    }
    catch (error) {
        debugger;
        console.error('Error Response: ', error.response);
        console.error('Error Message: ', error.message);
        return {
            data: "",
            message: error.message
        };
    }
});
exports.CreateFolios = CreateFolios;
