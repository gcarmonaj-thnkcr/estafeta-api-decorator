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
exports.WSPurchaseOrder = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("./auth");
const codesPurchase_1 = require("../utils/codesPurchase");
const client_1 = require("../commercetools/client");
const invertTaxes_1 = require("../utils/invertTaxes");
const getTypeCart = (order) => {
    var _a, _b, _c, _d;
    let attrType = (_a = order === null || order === void 0 ? void 0 : order.lineItems) === null || _a === void 0 ? void 0 : _a.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA"; });
    if (attrType)
        return "ZONA";
    attrType = (_b = order === null || order === void 0 ? void 0 : order.lineItems) === null || _b === void 0 ? void 0 : _b.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "UNIZONA"; });
    if (attrType)
        return "UNIZONA";
    attrType = (_c = order === null || order === void 0 ? void 0 : order.lineItems) === null || _c === void 0 ? void 0 : _c.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "RECOLECCION"; });
    if (attrType)
        return "RECOLECCION";
    attrType = (_d = order === null || order === void 0 ? void 0 : order.lineItems) === null || _d === void 0 ? void 0 : _d.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA INTERNACIONAL"; });
    if (attrType)
        return "INTERNACIONAL";
    return "USO";
};
let taxAmount = 16;
const WSPurchaseOrder = (_a) => __awaiter(void 0, [_a], void 0, function* ({ order, code, customer, idPaymentService, methodName, quantityTotalGuides, logger, infoPayment }) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const typeCart = getTypeCart(order);
    idPaymentService = idPaymentService.length > 10 ? idPaymentService.substring(0, 10) : idPaymentService;
    const purchaseLines = yield createLinePurchase(typeCart, order, code, quantityTotalGuides, customer, idPaymentService);
    const timeNow = new Date();
    const formattedDate = timeNow.toISOString().replace('T', ' ').slice(0, 19);
    if (!taxAmount)
        taxAmount = 16;
    const data = {
        "purchaseOrder": [
            {
                "SalesOrganizationCode": "87D",
                "code": code,
                "customerMail": (_b = customer.email) !== null && _b !== void 0 ? _b : "",
                "ticketCode": "43099",
                "services": purchaseLines,
                "servicesPay": [
                    {
                        "PurchaseOrderCode": code,
                        "CustomerCode": "000200087D",
                        "TicketCode": idPaymentService,
                        "PaymentMethodName": "Openpay",
                        "PaymentTypeName": infoPayment.typePayment, //Credit
                        "TransactionalCode": infoPayment.transactionalCode,
                        "PaymentCardNum": "",
                        "BankTypeName": infoPayment.bankTypeName,
                        "BankReferenceCode": "87D01189",
                        "PaymentAmount": order.totalPrice.centAmount / 100.00,
                        "PaidDateTime": formattedDate,
                        "PaymentCode": code
                    }
                ],
                "DiscountCode": (_g = (_f = (_e = (_d = (_c = order === null || order === void 0 ? void 0 : order.discountCodes) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.discountCode) === null || _e === void 0 ? void 0 : _e.obj) === null || _f === void 0 ? void 0 : _f.code.slice(0, 4)) !== null && _g !== void 0 ? _g : "0",
                "DiscouentRate": ((_j = (_h = order.discountOnTotalPrice) === null || _h === void 0 ? void 0 : _h.discountedAmount) === null || _j === void 0 ? void 0 : _j.centAmount) ? 1 : 0,
                "ValueAddTaxRate": taxAmount,
                "SubtotalOrderAmount": (order.totalPrice.centAmount + ((_m = (_l = (_k = order.discountOnTotalPrice) === null || _k === void 0 ? void 0 : _k.discountedAmount) === null || _l === void 0 ? void 0 : _l.centAmount) !== null && _m !== void 0 ? _m : 0)) / 100.00,
                "DiscountAmount": ((_q = (_p = (_o = order.discountOnTotalPrice) === null || _o === void 0 ? void 0 : _o.discountedAmount) === null || _p === void 0 ? void 0 : _p.centAmount) !== null && _q !== void 0 ? _q : 0) / 100.00,
                "ValueAddTaxAmount": taxAmount,
                "TotalOrderAmount": (order.totalPrice.centAmount) / 100.00,
                "statusOorder": "Pagado"
            }
        ]
    };
    logger.info(`Data purchase: ${JSON.stringify(data)}`);
    const token = yield (0, auth_1.authToken)({ type: 'purchaseOrder' });
    const config = {
        method: 'post',
        url: (_r = process.env.URL_PURCHASE) !== null && _r !== void 0 ? _r : "",
        headers: {
            APIKEY: (_s = process.env.API_KEY_PURCHASE) !== null && _s !== void 0 ? _s : "",
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        data: JSON.stringify(data),
    };
    try {
        const response = yield axios_1.default.request(config);
        logger.info(JSON.stringify(response.data));
        return response.data;
    }
    catch (error) {
        logger.error(error);
        throw error;
    }
});
exports.WSPurchaseOrder = WSPurchaseOrder;
const updatedCustomer = (email, fieldToUpdated, quantityGuidesLegacy, fieldToUpdatedGuides, type, idCustomer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const customerUpdated = yield client_1.apiRoot.customers().get({
        queryArgs: {
            where: `email in ("${email}")`
        }
    }).execute();
    const userUpdate = yield client_1.apiRoot.customers().withId({ ID: customerUpdated.body.results[0].id }).post({
        body: {
            version: customerUpdated.body.results[0].version,
            actions: [
                {
                    action: "setCustomField",
                    name: fieldToUpdated,
                    value: "0"
                },
                {
                    action: "setCustomField",
                    name: fieldToUpdatedGuides,
                    value: quantityGuidesLegacy
                }
            ]
        }
    }).execute();
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            where: `customerId in ("${idCustomer}") and custom(fields(isLegacy=true))`
        }
    }).execute();
    debugger;
    for (const order of orders.body.results) {
        debugger;
        const itemService = order.lineItems.find(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "servicio")) === null || _b === void 0 ? void 0 : _b.value["label"]) == type; });
        const jsonService = JSON.parse((_a = order.custom) === null || _a === void 0 ? void 0 : _a.fields["services"]);
        if (!jsonService)
            return;
        jsonService[(_b = itemService === null || itemService === void 0 ? void 0 : itemService.id) !== null && _b !== void 0 ? _b : ""].guides = [];
        const uOrder = yield client_1.apiRoot.orders().withId({ ID: order.id }).post({
            body: {
                version: order.version,
                actions: [
                    {
                        action: 'setCustomField',
                        name: 'services',
                        value: JSON.stringify(jsonService)
                    }
                ]
            }
        }).execute();
    }
});
const createLinePurchase = (typeCart, order, code, quantityTotalGuides, customer, idPaymentService) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35;
    debugger;
    if (typeCart == "UNIZONA") {
        const servicesLines = [];
        for (const line of order.lineItems.filter((line) => line.price.value.centAmount > 0)) {
            const type = (_c = (_b = (_a = line === null || line === void 0 ? void 0 : line.variant) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.find(attr => attr.name == "servicio")) === null || _c === void 0 ? void 0 : _c.value["label"];
            const quantity = (_g = (_f = (_e = (_d = line === null || line === void 0 ? void 0 : line.variant) === null || _d === void 0 ? void 0 : _d.attributes) === null || _e === void 0 ? void 0 : _e.find(attr => attr.name == "quantity-items")) === null || _f === void 0 ? void 0 : _f.value) !== null && _g !== void 0 ? _g : 1;
            const nameService = type !== null && type !== void 0 ? type : line.productKey;
            const codeMaterial = (0, codesPurchase_1.getCode)(nameService);
            let legacyCount = "0";
            debugger;
            if (type == "TERRESTRE") {
                legacyCount = (_k = (_j = (_h = customer.custom) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j["quantity-guides-terrestres-legacy"]) !== null && _k !== void 0 ? _k : "0";
                if (legacyCount != "0")
                    yield updatedCustomer(customer.email, "quantity-guides-terrestres-legacy", parseInt(legacyCount), "quantity-guides-terrestres", type, (_l = order === null || order === void 0 ? void 0 : order.customerId) !== null && _l !== void 0 ? _l : "");
            }
            else if (type == "DOS DIAS") {
                legacyCount = (_p = (_o = (_m = customer.custom) === null || _m === void 0 ? void 0 : _m.fields) === null || _o === void 0 ? void 0 : _o["quantity-guides-dos-dias-legacy"]) !== null && _p !== void 0 ? _p : "0";
                if (legacyCount != "0")
                    yield updatedCustomer(customer.email, "quantity-guides-dos-dias-legacy", parseInt(legacyCount), "quantity-guides-dos-dias", type, (_q = order === null || order === void 0 ? void 0 : order.customerId) !== null && _q !== void 0 ? _q : "");
            }
            else if (type == "DIA SIGUIENTE") {
                legacyCount = (_t = (_s = (_r = customer.custom) === null || _r === void 0 ? void 0 : _r.fields) === null || _s === void 0 ? void 0 : _s["quantity-guides-dia-siguiente-legacy"]) !== null && _t !== void 0 ? _t : "0";
                if (legacyCount != "0")
                    yield updatedCustomer(customer.email, "quantity-guides-dia-siguiente-legacy", parseInt(legacyCount), "quantity-guides-dia-siguiente", type, (_u = order === null || order === void 0 ? void 0 : order.customerId) !== null && _u !== void 0 ? _u : "");
            }
            else if (type == "DOCE TREINTA") {
                legacyCount = (_x = (_w = (_v = customer.custom) === null || _v === void 0 ? void 0 : _v.fields) === null || _w === void 0 ? void 0 : _w["quantity-guides-doce-treinta-legacy"]) !== null && _x !== void 0 ? _x : "0";
                if (legacyCount != "0")
                    yield updatedCustomer(customer.email, "quantity-guides-doce-treinta-legacy", parseInt(legacyCount), "quantity-guides-doce-treinta", type, (_y = order === null || order === void 0 ? void 0 : order.customerId) !== null && _y !== void 0 ? _y : "");
            }
            const quantityTotalGuides = quantity * line.quantity + parseInt(legacyCount);
            const purchaseLine = {
                PurchaseOrderCode: code, // Autoincrementable
                customerCode: "000200087D", // Dato fijo
                TicketCode: idPaymentService,
                MaterialCode: codeMaterial.code,
                MaterialName: line.name["es-MX"],
                MaterialQuantity: quantityTotalGuides,
                MaterialPrice: (0, invertTaxes_1.invertPrice)((line.price.value.centAmount) / 100.0, 16),
                MaterialDiscountAmount: !((_z = line.price.discounted) === null || _z === void 0 ? void 0 : _z.value.centAmount) ? ((_2 = (_1 = (_0 = order.discountOnTotalPrice) === null || _0 === void 0 ? void 0 : _0.discountedAmount) === null || _1 === void 0 ? void 0 : _1.centAmount) !== null && _2 !== void 0 ? _2 : 0) / 100.00 : ((_4 = (_3 = line.price.discounted) === null || _3 === void 0 ? void 0 : _3.value.centAmount) !== null && _4 !== void 0 ? _4 : 0) / 100.00,
                MaterialTaxAddAmount: 1,
                SummaryService: 270.7,
            };
            servicesLines.push(purchaseLine);
        }
        return servicesLines;
    }
    ;
    let servicesLines = [];
    for (const line of order.lineItems) {
        const type = (_7 = (_6 = (_5 = line === null || line === void 0 ? void 0 : line.variant) === null || _5 === void 0 ? void 0 : _5.attributes) === null || _6 === void 0 ? void 0 : _6.find(attr => attr.name == "tipo-paquete")) === null || _7 === void 0 ? void 0 : _7.value["label"];
        if (!type)
            continue;
        const adicionales = ((_8 = line.custom) === null || _8 === void 0 ? void 0 : _8.fields["adicionales"]) && JSON.parse((_9 = line.custom) === null || _9 === void 0 ? void 0 : _9.fields["adicionales"]);
        const sobrepeso = ((_10 = line.custom) === null || _10 === void 0 ? void 0 : _10.fields["sobrepeso"]) && JSON.parse((_11 = line.custom) === null || _11 === void 0 ? void 0 : _11.fields["sobrepeso"]);
        const tarifaBase = ((_12 = line.custom) === null || _12 === void 0 ? void 0 : _12.fields["tarifa_base"]) && JSON.parse((_13 = line.custom) === null || _13 === void 0 ? void 0 : _13.fields["tarifa_base"]);
        const quantity = (_17 = (_16 = (_15 = (_14 = line === null || line === void 0 ? void 0 : line.variant) === null || _14 === void 0 ? void 0 : _14.attributes) === null || _15 === void 0 ? void 0 : _15.find(attr => attr.name == "quantity-items")) === null || _16 === void 0 ? void 0 : _16.value) !== null && _17 !== void 0 ? _17 : 1;
        const nameService = (_21 = (_20 = (_19 = (_18 = line === null || line === void 0 ? void 0 : line.variant) === null || _18 === void 0 ? void 0 : _18.attributes) === null || _19 === void 0 ? void 0 : _19.find(attr => attr.name == "servicio")) === null || _20 === void 0 ? void 0 : _20.value["label"]) !== null && _21 !== void 0 ? _21 : line.productKey;
        const iva = parseFloat((_22 = line.custom) === null || _22 === void 0 ? void 0 : _22.fields["guia"]);
        taxAmount = iva;
        debugger;
        const codeMaterial = (0, codesPurchase_1.getCode)(nameService);
        const indexCodeMaterial = codeMaterial.code.charAt(0);
        quantityTotalGuides = quantity * line.quantity;
        let quitAdicionales = 0;
        if (sobrepeso) {
            Object.keys(sobrepeso).forEach(key => {
                const value = sobrepeso[key];
                if (!value || value == "0.00")
                    return;
                if (typeof value == "object" && Object.keys(value).length == 0)
                    return;
                const finalTotla = parseFloat(sobrepeso[key]) * line.quantity;
                quitAdicionales = quitAdicionales + finalTotla;
            });
        }
        if (tarifaBase) {
            if (tarifaBase["Cargo por Combustible"] && tarifaBase["Cargo por Combustible"] != "0.00") {
                const finalTotla = parseFloat(tarifaBase["Cargo por Combustible"]) * line.quantity;
                quitAdicionales = quitAdicionales + finalTotla;
            }
        }
        if (line.totalPrice.centAmount > 0) {
            quitAdicionales = quitAdicionales * 100;
            const finalPrice = (line.totalPrice.centAmount - quitAdicionales) | 0;
            console.log(codeMaterial.code);
            if (finalPrice > 0) {
                servicesLines.push({
                    PurchaseOrderCode: code, // Autoincrementable
                    customerCode: "000200087D", // Dato fijo
                    TicketCode: idPaymentService,
                    MaterialCode: codeMaterial.code,
                    MaterialName: line.name["es-MX"],
                    MaterialQuantity: quantity * line.quantity,
                    MaterialPrice: (0, invertTaxes_1.invertPrice)((finalPrice / 100.00), iva),
                    MaterialDiscountAmount: !((_23 = line.price.discounted) === null || _23 === void 0 ? void 0 : _23.value.centAmount) ? ((_26 = (_25 = (_24 = order.discountOnTotalPrice) === null || _24 === void 0 ? void 0 : _24.discountedAmount) === null || _25 === void 0 ? void 0 : _25.centAmount) !== null && _26 !== void 0 ? _26 : 0) / 100.00 : ((_28 = (_27 = line.price.discounted) === null || _27 === void 0 ? void 0 : _27.value.centAmount) !== null && _28 !== void 0 ? _28 : 0) / 100.00,
                    MaterialTaxAddAmount: 1,
                    SummaryService: 270.700000
                });
            }
        }
        console.log(servicesLines);
        if (adicionales) {
            const result = adicionales.reduce((acc, item) => {
                const keys = Object.keys(item);
                keys.forEach(key => {
                    if (item[key] !== '') {
                        const existing = acc.find((obj) => obj.code === key);
                        if (existing) {
                            existing.count += 1;
                        }
                        else {
                            acc.push({
                                code: key,
                                count: 1
                            });
                        }
                    }
                });
                return acc;
            }, []);
            for (const res of result) {
                let name = "";
                if (res.code == "enBio") {
                    name = "enBio";
                }
                else if (res.code == "seguro") {
                    name = "seguro-opcional";
                }
                else if (res.code == "manejable") {
                    name = "manejo-especial";
                }
                const item = order.lineItems.find(item => item.productKey == name);
                if (!item)
                    continue;
                const codeMaterial = (0, codesPurchase_1.getCode)((_29 = item.productKey) !== null && _29 !== void 0 ? _29 : res.code);
                servicesLines.push({
                    PurchaseOrderCode: code, // Autoincrementable
                    customerCode: "000200087D", // Dato fijo
                    TicketCode: idPaymentService,
                    MaterialCode: indexCodeMaterial + codeMaterial.code,
                    MaterialName: item.name["es-MX"],
                    MaterialQuantity: res.count,
                    MaterialPrice: typeCart == "INTERNACIONAL" ? (item.totalPrice.centAmount / 100.00) : (0, invertTaxes_1.invertPrice)((item.totalPrice.centAmount / 100.00), iva),
                    MaterialDiscountAmount: !((_30 = line.price.discounted) === null || _30 === void 0 ? void 0 : _30.value.centAmount) ? ((_33 = (_32 = (_31 = order.discountOnTotalPrice) === null || _31 === void 0 ? void 0 : _31.discountedAmount) === null || _32 === void 0 ? void 0 : _32.centAmount) !== null && _33 !== void 0 ? _33 : 0) / 100.00 : ((_35 = (_34 = line.price.discounted) === null || _34 === void 0 ? void 0 : _34.value.centAmount) !== null && _35 !== void 0 ? _35 : 0) / 100.00,
                    MaterialTaxAddAmount: 1,
                    SummaryService: 270.700000
                });
            }
        }
        if (sobrepeso) {
            Object.keys(sobrepeso).forEach(key => {
                const value = sobrepeso[key];
                if (typeof value == "object" && Object.keys(value).length == 0)
                    return;
                if (!value || value == "0.00")
                    return;
                let codeMaterial = {};
                if (key == "Sobrepeso") {
                    codeMaterial = (0, codesPurchase_1.getCode)("sobrepeso");
                }
                else if (key == "Reexpedicion") {
                    codeMaterial = (0, codesPurchase_1.getCode)("reexpedicion");
                }
                else {
                    codeMaterial = (0, codesPurchase_1.getCode)("combustible-por-peso");
                }
                servicesLines.push({
                    PurchaseOrderCode: code, // Autoincrementable
                    customerCode: "000200087D", // Dato fijo
                    TicketCode: idPaymentService,
                    MaterialCode: indexCodeMaterial + codeMaterial.code,
                    MaterialName: key,
                    MaterialQuantity: line.quantity,
                    MaterialPrice: (0, invertTaxes_1.invertPrice)(sobrepeso[key], iva) * line.quantity,
                    MaterialDiscountAmount: 0,
                    MaterialTaxAddAmount: 1,
                    SummaryService: 270.700000
                });
            });
        }
        if (tarifaBase) {
            if (tarifaBase["Cargo por Combustible"] && tarifaBase["Cargo por Combustible"] != "0.00") {
                const codeMaterial = (0, codesPurchase_1.getCode)("cargo-combustible");
                servicesLines.push({
                    PurchaseOrderCode: code, // Autoincrementable
                    customerCode: "000200087D", // Dato fijo
                    TicketCode: idPaymentService,
                    MaterialCode: indexCodeMaterial + codeMaterial.code,
                    MaterialName: "Cargo por Combustible",
                    MaterialQuantity: line.quantity,
                    MaterialPrice: (0, invertTaxes_1.invertPrice)(tarifaBase["Cargo por Combustible"], iva) * line.quantity,
                    MaterialDiscountAmount: 0,
                    MaterialTaxAddAmount: 1,
                    SummaryService: 270.700000
                });
            }
        }
    }
    return servicesLines;
});
