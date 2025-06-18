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
const customObjectsFunction_1 = require("../../utils/customObjectsFunction");
const router = (0, express_1.Router)();
const validateWaybillRequest = (waybillService) => {
    const isValid = waybillService.every((service) => typeof service.storePortalOrder === "string" &&
        typeof service.storeFolioOrder === "string" &&
        typeof service.eMailClient === "string" &&
        typeof service.serviceWarranty === "string" &&
        typeof service.serviceModality === "string" &&
        typeof service.waybill === "string" &&
        typeof service.statusFolioOrder === "string" &&
        typeof service.usedDate === "string" &&
        typeof service.IsGenerator === "boolean");
    return isValid;
};
router.post("/waybills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const { WaybillService } = req.body;
    const isValid = validateWaybillRequest(WaybillService);
    if (!isValid) {
        return res.status(400).send({ message: "Invalid WaybillService format." });
    }
    let resulWaylBill = [];
    for (const wayBillItem of WaybillService) {
        const order = yield client_1.apiRoot
            .orders()
            .search()
            .post({
            body: {
                query: {
                    fullText: {
                        field: "custom.services",
                        value: wayBillItem.qr,
                        customType: "StringType",
                    },
                },
            },
        })
            .execute();
        let searchOrder = {};
        let userId = "";
        let idOrder = "";
        if (order.body.hits.length <= 0) {
            //@ts-ignore
            const order = yield (0, customObjectsFunction_1.getCustomObjectByQr)(wayBillItem.qr);
            searchOrder = order.order;
            userId = order.user;
            idOrder = order.order.id;
        }
        else {
            const getOrder = yield client_1.apiRoot
                .orders()
                .withId({ ID: order.body.hits[0].id })
                .get()
                .execute();
            if (!getOrder.statusCode || getOrder.statusCode >= 300)
                return res.sendStatus(404);
            searchOrder = getOrder.body;
            userId = (_a = searchOrder === null || searchOrder === void 0 ? void 0 : searchOrder.customerId) !== null && _a !== void 0 ? _a : "";
            idOrder = searchOrder.id;
        }
        console.log(searchOrder);
        const customObject = ((_b = searchOrder.custom) === null || _b === void 0 ? void 0 : _b.fields["services"]) &&
            JSON.parse(searchOrder.custom.fields["services"]);
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
        console.log("Esto actualizare", servicesFind);
        if (!(servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) || (servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) == "DISPONIBLE") {
            servicesFind.status = "EN PROCESO";
        }
        else {
            resulWaylBill.push({
                resultCode: "1",
                resultDescription: "El estado actual de la guía es En proceso",
            });
            continue;
        }
        console.log("Actualizado", customObject[idItem].guides);
        console.log(customObject);
        resulWaylBill.push({
            resultCode: "0",
            resultDescription: "Proceso completo",
            ResultWaybill: servicesFind.guide,
        });
        try {
            let ordenN = Object.assign(Object.assign({}, searchOrder), { custom: {
                    type: {
                        id: (_e = (_d = (_c = searchOrder.custom) === null || _c === void 0 ? void 0 : _c.type) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "",
                        typeId: (_h = (_g = (_f = searchOrder.custom) === null || _f === void 0 ? void 0 : _f.type) === null || _g === void 0 ? void 0 : _g.typeId) !== null && _h !== void 0 ? _h : "type",
                    },
                    fields: Object.assign(Object.assign({}, (_j = searchOrder.custom) === null || _j === void 0 ? void 0 : _j.fields), { services: JSON.stringify(customObject) }),
                } });
            yield client_1.apiRoot
                .orders()
                .withId({ ID: searchOrder.id })
                .post({
                body: {
                    version: searchOrder.version,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "services",
                            value: JSON.stringify(customObject),
                        },
                    ],
                },
            })
                .execute();
            yield client_1.apiRoot
                .customObjects()
                .post({
                body: {
                    container: "orderStatus",
                    key: wayBillItem.qr,
                    value: {
                        order: ordenN,
                        qr: wayBillItem.qr,
                        user: userId,
                        idOrden: idOrder,
                        isOrdenCustom: "No",
                    },
                },
            })
                .execute();
        }
        catch (_) {
            const order = yield client_1.apiRoot
                .customObjects()
                .get({
                queryArgs: {
                    where: `value (order (id in ("${idOrder}")))`,
                },
            })
                .execute();
            let ordenN = Object.assign(Object.assign({}, searchOrder), { custom: {
                    type: {
                        id: (_m = (_l = (_k = searchOrder.custom) === null || _k === void 0 ? void 0 : _k.type) === null || _l === void 0 ? void 0 : _l.id) !== null && _m !== void 0 ? _m : "",
                        typeId: (_q = (_p = (_o = searchOrder.custom) === null || _o === void 0 ? void 0 : _o.type) === null || _p === void 0 ? void 0 : _p.typeId) !== null && _q !== void 0 ? _q : "type",
                    },
                    fields: Object.assign(Object.assign({}, (_r = searchOrder.custom) === null || _r === void 0 ? void 0 : _r.fields), { services: JSON.stringify(customObject) }),
                } });
            yield client_1.apiRoot
                .customObjects()
                .post({
                body: {
                    container: "orderStatus",
                    key: wayBillItem.qr,
                    value: {
                        order: ordenN,
                        qr: wayBillItem.qr,
                        user: userId,
                        idOrden: idOrder,
                        isOrdenCustom: "Si",
                    },
                },
            })
                .execute();
            for (const orden of order.body.results) {
                yield client_1.apiRoot
                    .customObjects()
                    .post({
                    body: {
                        container: "orders",
                        key: orden.value.qr,
                        value: {
                            order: ordenN,
                            qr: orden.value.qr,
                            user: orden.value.user,
                            idOrden: orden.value.orderId,
                        },
                    },
                })
                    .execute();
            }
        }
    }
    //Si esta disonible cambiar a enproceso y retornar datos del waybill
    /// Extraer la guia disponible de las ordenes de combo
    /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
    /// Crear la estructura de data.WaybillService
    res.status(200).json(resulWaylBill[0]);
}));
router.put("/waybills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const { AsignWaybillOrder } = req.body;
    const isValid = validateWaybillRequest(AsignWaybillOrder);
    if (!isValid) {
        return res.status(400).send({ message: "Invalid WaybillService format." });
    }
    let resulWaylBill = [];
    for (const wayBillItem of AsignWaybillOrder) {
        const order = yield client_1.apiRoot
            .orders()
            .search()
            .post({
            body: {
                query: {
                    fullText: {
                        field: "custom.services",
                        value: wayBillItem.qr,
                        customType: "StringType",
                    },
                },
            },
        })
            .execute();
        let searchOrder = {};
        let userId = "";
        let idOrder = "";
        if (order.body.hits.length <= 0) {
            //@ts-ignore
            const order = yield (0, customObjectsFunction_1.getCustomObjectByQr)(wayBillItem.qr);
            searchOrder = order.order;
            userId = order.user;
            idOrder = order.order.id;
        }
        else {
            const getOrder = yield client_1.apiRoot
                .orders()
                .withId({ ID: order.body.hits[0].id })
                .get()
                .execute();
            if (!getOrder.statusCode || getOrder.statusCode >= 300)
                return res.sendStatus(404);
            searchOrder = getOrder.body;
            userId = (_a = searchOrder === null || searchOrder === void 0 ? void 0 : searchOrder.customerId) !== null && _a !== void 0 ? _a : "";
            idOrder = searchOrder.id;
        }
        const customObject = ((_b = searchOrder.custom) === null || _b === void 0 ? void 0 : _b.fields["services"]) &&
            JSON.parse(searchOrder.custom.fields["services"]);
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
            resultCode: 0,
            resultDescription: "Proceso satisfactorio.",
            resultAsignWaybill: [
                {
                    resultCode: 0,
                    resultDescription: "Registro actualizado",
                    resultWayBill: servicesFind.guide,
                },
            ],
        });
        try {
            let ordenN = Object.assign(Object.assign({}, searchOrder), { custom: {
                    type: {
                        id: (_e = (_d = (_c = searchOrder.custom) === null || _c === void 0 ? void 0 : _c.type) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "",
                        typeId: (_h = (_g = (_f = searchOrder.custom) === null || _f === void 0 ? void 0 : _f.type) === null || _g === void 0 ? void 0 : _g.typeId) !== null && _h !== void 0 ? _h : "type",
                    },
                    fields: Object.assign(Object.assign({}, (_j = searchOrder.custom) === null || _j === void 0 ? void 0 : _j.fields), { services: JSON.stringify(customObject) }),
                } });
            yield client_1.apiRoot
                .orders()
                .withId({ ID: searchOrder.id })
                .post({
                body: {
                    version: searchOrder.version,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "services",
                            value: JSON.stringify(customObject),
                        },
                    ],
                },
            })
                .execute();
            const statusO = yield client_1.apiRoot
                .customObjects()
                .withContainer({ container: "orderStatus" })
                .get({
                queryArgs: {
                    where: `value (order (id in ("${idOrder}")))`,
                },
            })
                .execute();
            yield client_1.apiRoot
                .customObjects()
                .withContainerAndKey({
                container: "orderStatus",
                key: wayBillItem.key,
            })
                .delete({
                queryArgs: {
                    version: statusO.body.results[0].version,
                },
            })
                .execute();
        }
        catch (_) {
            const order = yield client_1.apiRoot
                .customObjects()
                .withContainer({ container: "orders" })
                .get({
                queryArgs: {
                    where: `value (order (id in ("${idOrder}")))`,
                },
            })
                .execute();
            yield client_1.apiRoot
                .customObjects()
                .withContainer({ container: "orderStatus" })
                .get({
                queryArgs: {
                    where: `key in ("${wayBillItem.qr}")`,
                },
            })
                .execute();
            let ordenN = Object.assign(Object.assign({}, searchOrder), { custom: {
                    type: {
                        id: (_m = (_l = (_k = searchOrder.custom) === null || _k === void 0 ? void 0 : _k.type) === null || _l === void 0 ? void 0 : _l.id) !== null && _m !== void 0 ? _m : "",
                        typeId: (_q = (_p = (_o = searchOrder.custom) === null || _o === void 0 ? void 0 : _o.type) === null || _p === void 0 ? void 0 : _p.typeId) !== null && _q !== void 0 ? _q : "type",
                    },
                    fields: Object.assign(Object.assign({}, (_r = searchOrder.custom) === null || _r === void 0 ? void 0 : _r.fields), { services: JSON.stringify(customObject) }),
                } });
            try {
                const statusO = yield client_1.apiRoot
                    .customObjects()
                    .withContainer({ container: "orderStatus" })
                    .get({
                    queryArgs: {
                        where: `value (order (id in ("${idOrder}")))`,
                    },
                })
                    .execute();
                yield client_1.apiRoot
                    .customObjects()
                    .withContainerAndKey({
                    container: "orderStatus",
                    key: wayBillItem.key,
                })
                    .delete({
                    queryArgs: {
                        version: statusO.body.results[0].version,
                    },
                })
                    .execute();
            }
            catch (_) { }
            for (const orden of order.body.results) {
                yield client_1.apiRoot
                    .customObjects()
                    .post({
                    body: {
                        container: "orders",
                        key: orden.value.qr,
                        value: {
                            order: ordenN,
                            qr: orden.value.qr,
                            user: orden.value.user,
                            idOrden: orden.value.orderId,
                        },
                    },
                })
                    .execute();
            }
        }
    }
    res.status(200).json(resulWaylBill[0]);
}));
exports.default = router;
