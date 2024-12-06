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
const token_1 = require("../../jsonToken/token");
const client_1 = require("../../commercetools/client");
const formaterDate_1 = require("../../utils/formaterDate");
const router = (0, express_1.Router)();
router.get("/pdv-services", token_1.validateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const qr = req.headers.qr;
    if (!qr || qr == '')
        return res.sendStatus(404);
    const order = yield client_1.apiRoot.orders().search().post({
        body: {
            query: {
                fullText: {
                    field: "custom.services",
                    value: qr,
                    customType: "StringType"
                }
            }
        }
    }).execute();
    console.log(order.body.hits);
    if (order.body.hits.length <= 0)
        return res.sendStatus(404);
    const searchOrder = yield client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute();
    if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
        return res.sendStatus(404);
    const customer = yield client_1.apiRoot.customers().withId({ ID: (_b = (_a = searchOrder.body) === null || _a === void 0 ? void 0 : _a.customerId) !== null && _b !== void 0 ? _b : "" }).get().execute();
    const customObject = ((_c = searchOrder.body.custom) === null || _c === void 0 ? void 0 : _c.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
    let servicesFind;
    try {
        servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item) => item.QR == qr);
    }
    catch (err) {
        servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item) => item.QR == qr);
    }
    console.log(servicesFind);
    const { origin, destination } = servicesFind.address;
    const responseObject = {
        "pdvService": {
            "storeServiceOrder": searchOrder.body.id,
            "PurchaseOrder": (_g = (_d = searchOrder.body.orderNumber) !== null && _d !== void 0 ? _d : (_f = (_e = searchOrder.body.custom) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f["pickupNumber"]) !== null && _g !== void 0 ? _g : "",
            "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.guide,
            "idcaStoreClient": searchOrder.body.customerId,
            "eMailClient": customer.body.email,
            "idcaServiceWarranty": servicesFind.guide[13],
            "idcaServiceModality": servicesFind.guide[14],
            "isPudo": servicesFind.isPudo ? "1" : "0",
            "isPackage": servicesFind.isPackage ? "1" : "0",
            "itemLength": (_h = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemLength) !== null && _h !== void 0 ? _h : "",
            "itemHeight": (_j = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemHeight) !== null && _j !== void 0 ? _j : "",
            "itemWidth": (_k = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWidth) !== null && _k !== void 0 ? _k : "",
            "itemVolumen": (_l = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemVolumen) !== null && _l !== void 0 ? _l : "",
            "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
            "itemWeight": (_m = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWeight) !== null && _m !== void 0 ? _m : "",
            "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
            "statusServiceOrder": (_o = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) !== null && _o !== void 0 ? _o : "DISPONIBLE",
            "QRCode": "", // Vacio
            "QRCodeMD5": servicesFind.QR,
            "TarriffFractionCode": "0",
            "consultaId": "99999999", /// Revisarlo con Memo
            "createdDate": (0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false),
            "availabledDate": `${(0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false)} - ${(0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false)}`,
            "sender": {
                "eMailClient": origin.email, //email del remitente
                "isPudo": "0",
                "EquivalentCode": "123",
                "TyoeLocationName": "Nombre del Pudo",
                "SpaceOwnerName": "Tipo de pudo",
                "isSender": "0",
                "Alias": "",
                "TaxPayer": "",
                "CompleteName": (_r = (_q = (_p = origin === null || origin === void 0 ? void 0 : origin.firstName) !== null && _p !== void 0 ? _p : "" + " " + (origin === null || origin === void 0 ? void 0 : origin.lastName)) !== null && _q !== void 0 ? _q : "" + " " + (origin === null || origin === void 0 ? void 0 : origin.middleName)) !== null && _r !== void 0 ? _r : "",
                "zipCode": origin.postalCode,
                "roadTypeCode": "9999",
                "roadTypeName": origin.road,
                "street": origin.street,
                "externalNum": origin.exteriorNumber,
                "indoreInformation": (_s = origin === null || origin === void 0 ? void 0 : origin.interiorNumber) !== null && _s !== void 0 ? _s : "",
                "settlementTypeCode": "999",
                "settlementTypeName": origin.settlement,
                "SettlementTypeAbbName": origin.settlement.slice(0, 3),
                "settlementName": "",
                "twnshipCode": "",
                "twnshipName": "",
                "stateCode": origin.stateCode,
                "stateName": origin.state,
                "countryCode": origin.countryCode,
                "countryCodeAlfa3": origin.countryCodeAlfa3,
                "countryName": origin.country,
                "betweenRoadName1": (_t = origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) !== null && _t !== void 0 ? _t : "",
                "betweenRoadName2": "y" + " " + (origin === null || origin === void 0 ? void 0 : origin.optionalAddress2),
                "AddressReference": (_u = origin === null || origin === void 0 ? void 0 : origin.reference) !== null && _u !== void 0 ? _u : "",
                "CountryCodePhone": "999",
                "LandlinePhone": origin.phone1,
                "CellPhone": (_v = origin === null || origin === void 0 ? void 0 : origin.phon2) !== null && _v !== void 0 ? _v : "",
                "ContacteMail": origin.email,
                "Latitude": 99999.99,
                "Longitude": 99999.99,
                "IsActive": "True",
                "recipient": {
                    "eMailClient": destination.email, //email del destinatario
                    "isPudo": "0",
                    "EquivalentCode": "",
                    "TyoeLocationName": "",
                    "SpaceOwnerName": "",
                    "isSender": "0",
                    "Alias": "",
                    "TaxPayer": "",
                    "CompleteName": (_y = (_x = (_w = destination === null || destination === void 0 ? void 0 : destination.firstName) !== null && _w !== void 0 ? _w : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.lastName)) !== null && _x !== void 0 ? _x : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.middleName)) !== null && _y !== void 0 ? _y : "",
                    "zipCode": destination.postalCode,
                    "roadTypeCode": "",
                    "roadTypeName": destination.road,
                    "street": destination.street,
                    "externalNum": destination.exteriorNumber,
                    "indoreInformation": (_z = destination === null || destination === void 0 ? void 0 : destination.interiorNumber) !== null && _z !== void 0 ? _z : "",
                    "settlementTypeCode": "",
                    "settlementTypeName": destination.settlement,
                    "SettlementTypeAbbName": destination.settlement.slice(0, 3),
                    "settlementName": "",
                    "twnshipCode": "",
                    "twnshipName": "",
                    "stateCode": destination.stateCode,
                    "stateName": destination.state,
                    "countryCode": destination.countryCode,
                    "countryCodeAlfa3": destination.countryCodeAlfa3,
                    "countryCodeAlfa2": destination.countryCodeAlfa2,
                    "countryName": destination.country,
                    "betweenRoadName1": (_0 = destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) !== null && _0 !== void 0 ? _0 : "",
                    "betweenRoadName2": "y" + " " + (destination === null || destination === void 0 ? void 0 : destination.optionalAddress2),
                    "AddressReference": (_1 = destination === null || destination === void 0 ? void 0 : destination.reference) !== null && _1 !== void 0 ? _1 : "",
                    "CountryCodePhone": "",
                    "LandlinePhone": destination.phone1,
                    "CellPhone": (_2 = destination === null || destination === void 0 ? void 0 : destination.phon2) !== null && _2 !== void 0 ? _2 : "",
                    "ContacteMail": destination.email,
                    "Latitude": 99999.99,
                    "Longitude": 99999.99,
                    "IsActive": "True",
                }
            }
        }
    };
    res.json({
        statusCode: 200,
        resultCode: 0,
        resultDescription: "",
        body: responseObject,
    });
}));
exports.default = router;
