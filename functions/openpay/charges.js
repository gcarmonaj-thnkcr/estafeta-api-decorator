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
exports.getChargeByTransactionId = void 0;
const axios_1 = __importDefault(require("axios"));
const getChargeByTransactionId = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const token = Buffer.from(`${process.env.OPENPAY_PRIMARY_KEY}:`, 'utf8').toString('base64');
    const urlRequest = `${process.env.OPENPAY_URL}/${process.env.OPENPAY_MERCHANT_ID}/charges/${transactionId}`;
    try {
        const request = yield axios_1.default.get(urlRequest, {
            headers: {
                "Authorization": `Basic ${token}`
            }
        });
        console.log("Openpay token:", request);
        if (request.status >= 300)
            return request.data.description;
        return request.data;
    }
    catch (err) {
        console.error("Openpay error:", err);
        return err;
    }
});
exports.getChargeByTransactionId = getChargeByTransactionId;
