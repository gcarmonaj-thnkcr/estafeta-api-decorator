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
exports.handler = handler;
const token_1 = require("./jsonToken/token");
const createReport_1 = require("./utils/createReport");
function handler(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const authHeader = ((_a = event.headers) === null || _a === void 0 ? void 0 : _a.authorization) || ((_b = event.headers) === null || _b === void 0 ? void 0 : _b.Authorization);
            const tokenCheck = (0, token_1.validateTokenServerless)(authHeader);
            if (!tokenCheck.valid) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ message: tokenCheck.message || 'No autorizado.' })
                };
            }
            const { dateStart, dateEnd } = JSON.parse(event.body || '{}');
            if (!dateStart || !dateEnd) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Fechas requeridas" })
                };
            }
            const report = yield (0, createReport_1.createReport)(dateStart, dateEnd);
            if (report.status >= 300 || !report.data) {
                return {
                    statusCode: report.status,
                    body: JSON.stringify({ message: report.message })
                };
            }
            const buffer = yield report.data.xlsx.writeBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': 'attachment; filename="reporte.xlsx"',
                },
                body: base64,
                isBase64Encoded: true
            };
        }
        catch (err) {
            console.error("Error al generar Excel:", err);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error interno" })
            };
        }
    });
}
