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
        url: 'https://apimwsbotrastreoqa.estafeta.com/Folios_IS/rest/FoliosManagement/CreateFolio',
        headers: {
            'apikey': 'dde71ba840d743e1b217db74e4785574',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cookie': 'dd4f03=pdaswPuDm9YyIYorIacttqNYnhSBitzehBSStG2X5HPhv3ijCDKesbRzoSQkgQX5QbFA7eQoQUwuYma/CTSimSpocQ6/wtBu/M1EV0JoxRx8q4eGZO/b1VCKBVNundXbMxDuhiX90iuiUu0zlk0FOePVlKLg8rWp8/N0Fq+J+ro0FWde'
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
