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
const client_1 = require("../../commercetools/client");
const router = (0, express_1.Router)();
const validateWaybillRequest = (waybillService) => {
    const isValid = waybillService.every((service) => typeof service.storePortalOrder === 'string' &&
        typeof service.storeFolioOrder === 'string' &&
        typeof service.eMailClient === 'string' &&
        typeof service.serviceWarranty === 'string' &&
        typeof service.serviceModality === 'string' &&
        typeof service.waybill === 'string' &&
        typeof service.statusFolioOrder === 'string' &&
        typeof service.usedDate === 'string' &&
        typeof service.IsGenerator === 'boolean');
    return isValid;
};
router.post("/waybills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { WaybillService } = req.body;
    const isValid = validateWaybillRequest(WaybillService);
    if (!isValid) {
        return res.status(400).send({ message: 'Invalid WaybillService format.' });
    }
    let resulWaylBill = [];
    for (const wayBillItem of WaybillService) {
        console.log(wayBillItem.qr);
        const order = yield client_1.apiRoot.orders().search().post({
            body: {
                query: {
                    fullText: {
                        field: "custom.services",
                        value: wayBillItem.qr,
                        customType: "StringType"
                    }
                }
            }
        }).execute();
        if (order.body.total <= 0) {
            resulWaylBill.push({
                "resultCode": "1",
                "resultDescription": "El QR no fue encontrado",
            });
            res.status(200).json(resulWaylBill[0]);
            return;
        }
        const searchOrder = yield client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute();
        if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
            return res.sendStatus(404);
        const customObject = ((_a = searchOrder.body.custom) === null || _a === void 0 ? void 0 : _a.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
        let servicesFind;
        let idItem = "";
        try {
            for (const id in customObject) {
                servicesFind = customObject[id].find((item) => item.QR == wayBillItem.qr);
                if (!servicesFind)
                    continue;
                idItem = id;
                break;
            }
        }
        catch (err) {
            for (const id in customObject) {
                servicesFind = customObject[id].guides.find((item) => item.QR == wayBillItem.qr);
                if (!servicesFind)
                    continue;
                idItem = id;
                break;
            }
        }
        if (!(servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) || (servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) == "DISPONIBLE") {
            servicesFind.status = "EN PROCESO";
        }
        else {
            resulWaylBill.push({
                "resultCode": "1",
                "resultDescription": "El estado actual de la guía es En proceso",
            });
            continue;
        }
        customObject[idItem].guides[0] = servicesFind;
        console.log("Actualizado", servicesFind);
        console.log(customObject);
        resulWaylBill.push({
            "resultCode": "0",
            "resultDescription": "Proceso completo",
            "ResultWaybill": servicesFind.guide,
        });
        yield client_1.apiRoot.orders().withId({ ID: searchOrder.body.id }).post({
            body: {
                version: searchOrder.body.version,
                actions: [
                    {
                        action: "setCustomField",
                        name: "services",
                        value: JSON.stringify(customObject)
                    }
                ]
            }
        }).execute();
    }
    //Si esta disonible cambiar a enproceso y retornar datos del waybill
    /// Extraer la guia disponible de las ordenes de combo
    /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
    /// Crear la estructura de data.WaybillService
    res.status(200).json(resulWaylBill[0]);
}));
router.put("/waybills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { AsignWaybillOrder } = req.body;
    const isValid = validateWaybillRequest(AsignWaybillOrder);
    if (!isValid) {
        return res.status(400).send({ message: 'Invalid WaybillService format.' });
    }
    let resulWaylBill = [];
    for (const wayBillItem of AsignWaybillOrder) {
        const order = yield client_1.apiRoot.orders().search().post({
            body: {
                query: {
                    fullText: {
                        field: "custom.services",
                        value: wayBillItem.qr,
                        customType: "StringType"
                    }
                }
            }
        }).execute();
        const searchOrder = yield client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute();
        if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
            return res.sendStatus(404);
        const customObject = ((_a = searchOrder.body.custom) === null || _a === void 0 ? void 0 : _a.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
        let servicesFind;
        try {
            for (const id in customObject) {
                servicesFind = customObject[id].find((item) => item.QR == wayBillItem.qr);
                if (!servicesFind)
                    continue;
            }
        }
        catch (err) {
            for (const id in customObject) {
                servicesFind = customObject[id].guides.find((item) => item.QR == wayBillItem.qr);
                if (!servicesFind)
                    continue;
            }
        }
        if (servicesFind.status) {
            switch (wayBillItem.statusFolioOrder) {
                case "UTIL":
                    servicesFind.status = "UTILIZADO";
                    break;
                case "DISP":
                    servicesFind.status = "DISPONIBLE";
                    break;
                case "CANC":
                    servicesFind.status = "CANCELADO";
                    break;
                case "ENPR":
                    servicesFind.status = "EN PROCESO";
                    break;
            }
        }
        resulWaylBill.push({
            "resultCode": 0,
            "resultDescription": "Proceso satisfactorio.",
            "resultAsignWaybill": [
                {
                    "resultCode": 0,
                    "resultDescription": "Registro actualizado",
                    "resultWayBill": servicesFind.guide,
                }
            ]
        });
        yield client_1.apiRoot.orders().withId({ ID: searchOrder.body.id }).post({
            body: {
                version: searchOrder.body.version,
                actions: [
                    {
                        action: "setCustomField",
                        name: "services",
                        value: JSON.stringify(customObject)
                    }
                ]
            }
        }).execute();
    }
    res.status(200).json(resulWaylBill[0]);
}));
exports.default = router;
