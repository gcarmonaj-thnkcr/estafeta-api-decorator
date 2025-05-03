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
const createReport_1 = require("../../utils/createReport");
const router = (0, express_1.Router)();
router.post("/report", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dateStart, dateEnd } = req.body;
    if (!dateStart || !dateEnd)
        return res.status(400).send({
            message: "Proporciona una fecha inicial o una fecha fin para el reporte"
        });
    try {
        const report = yield (0, createReport_1.createReport)(dateStart, dateEnd);
        if (report.status >= 300) {
            return res.status(report.status).send({ message: report.message });
        }
        if (!report.data) {
            return res.status(report.status).send({ message: report.message });
        }
        const buffer = yield report.data.xlsx.writeBuffer();
        const newBuffer = Buffer.from(buffer);
        const sBuffer = newBuffer.toString("base64");
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="reporte.xlsx"',
            },
            body: sBuffer,
            isBase64Encoded: true
        };
    }
    catch (err) {
        console.error('Error en generación de reporte:', err);
        return res.status(500).send({
            message: "Error interno al generar el archivo Excel"
        });
    }
}));
exports.default = router;
