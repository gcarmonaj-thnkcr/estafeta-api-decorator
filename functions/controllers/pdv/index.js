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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
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
    if (order.body.hits.length <= 0)
        return res.sendStatus(404);
    const searchOrder = yield client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute();
    if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
        return res.sendStatus(404);
    const customer = yield client_1.apiRoot.customers().withId({ ID: (_b = (_a = searchOrder.body) === null || _a === void 0 ? void 0 : _a.customerId) !== null && _b !== void 0 ? _b : "" }).get().execute();
    const customObject = ((_c = searchOrder.body.custom) === null || _c === void 0 ? void 0 : _c.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
    let servicesFind;
    try {
        const lineItems = searchOrder.body.lineItems.filter(item => { var _a, _b; return (_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0; });
        for (const line of lineItems) {
            servicesFind = customObject[line.id].find((item) => item.QR == qr);
            if (servicesFind)
                break;
        }
    }
    catch (err) {
        const lineItems = searchOrder.body.lineItems.filter(item => { var _a, _b; return (_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0; });
        for (const line of lineItems) {
            servicesFind = customObject[line.id].guides.find((item) => item.QR == qr);
            if (servicesFind)
                break;
        }
    }
    const { origin, destination } = servicesFind.address;
    const betweenRoadsOrigin = ((_d = origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) === null || _d === void 0 ? void 0 : _d.includes("?")) ? origin.optionalAddress1.split("?") : [origin.optionalAddress1];
    const betweenRoadsDestination = ((_e = destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) === null || _e === void 0 ? void 0 : _e.includes("?")) ? destination.optionalAddress1.split("?") : [destination.optionalAddress1];
    const responseObject = {
        "pdvService": {
            "storeServiceOrder": searchOrder.body.id,
            "PurchaseOrder": (_j = (_f = searchOrder.body.orderNumber) !== null && _f !== void 0 ? _f : (_h = (_g = searchOrder.body.custom) === null || _g === void 0 ? void 0 : _g.fields) === null || _h === void 0 ? void 0 : _h["pickupNumber"]) !== null && _j !== void 0 ? _j : "",
            "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.guide,
            "idcaStoreClient": searchOrder.body.customerId,
            "eMailClient": customer.body.email,
            "idcaServiceWarranty": servicesFind.guide[13],
            "idcaServiceModality": servicesFind.guide[14],
            "isPudo": servicesFind.isPudo ? "1" : "0",
            "isPackage": servicesFind.isPackage ? "1" : "0",
            "itemLength": (_k = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemLength) !== null && _k !== void 0 ? _k : "",
            "itemHeight": (_l = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemHeight) !== null && _l !== void 0 ? _l : "",
            "itemWidth": (_m = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWidth) !== null && _m !== void 0 ? _m : "",
            "itemVolumen": (_o = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemVolumen) !== null && _o !== void 0 ? _o : "",
            "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
            "itemWeight": (_p = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWeight) !== null && _p !== void 0 ? _p : "",
            "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
            "statusServiceOrder": (_q = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) !== null && _q !== void 0 ? _q : "DISPONIBLE",
            "QRCode": "", // Vacio
            "QRCodeMD5": servicesFind.QR,
            "TarriffFractionCode": "0",
            "consultaId": "99999999", /// Revisarlo con Memo
            "createdDate": (0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false),
            "availabledDate": `${(0, formaterDate_1.FormaterDate)(new Date(searchOrder.body.createdAt).toISOString(), false)} - ${(0, formaterDate_1.FormaterDate)(new Date(new Date(searchOrder.body.createdAt).setDate(new Date(searchOrder.body.createdAt).getDate() + 30)).toISOString(), false)}`,
            "sender": {
                "eMailClient": origin.email, //email del remitente
                "isPudo": origin.isPudo ? "1" : "0",
                "EquivalentCode": "",
                "TyoeLocationName": "",
                "SpaceOwnerName": "",
                "isSender": "1",
                "Alias": origin.alias,
                "TaxPayer": "",
                "CompleteName": `${(_r = origin === null || origin === void 0 ? void 0 : origin.firstName) !== null && _r !== void 0 ? _r : ""} ${(_s = origin === null || origin === void 0 ? void 0 : origin.lastName) !== null && _s !== void 0 ? _s : ""} ${(_t = origin === null || origin === void 0 ? void 0 : origin.middleName) !== null && _t !== void 0 ? _t : ""}`,
                "zipCode": origin.postalCode,
                "roadTypeCode": "9999",
                "roadTypeName": origin.road,
                "street": origin.street,
                "externalNum": origin.exteriorNumber,
                "indoreInformation": (_u = origin === null || origin === void 0 ? void 0 : origin.interiorNumber) !== null && _u !== void 0 ? _u : "",
                "settlementTypeCode": "999",
                "settlementTypeName": origin === null || origin === void 0 ? void 0 : origin.settlement,
                "SettlementTypeAbbName": (_v = origin === null || origin === void 0 ? void 0 : origin.settlement) === null || _v === void 0 ? void 0 : _v.slice(0, 3),
                "settlementName": origin.neighborhood,
                "twnshipCode": "",
                "twnshipName": origin.city,
                "stateCode": origin.stateCode,
                "stateName": origin.state,
                "countryCode": "MX",
                "countryCodeAlfa3": "MEX",
                "countryName": "México",
                "betweenRoadName1": (_w = betweenRoadsOrigin[0]) !== null && _w !== void 0 ? _w : ((origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) == " y " ? "" : ""),
                "betweenRoadName2": (_x = betweenRoadsOrigin[1]) !== null && _x !== void 0 ? _x : " ",
                "AddressReference": (_y = origin === null || origin === void 0 ? void 0 : origin.reference) !== null && _y !== void 0 ? _y : "",
                "CountryCodePhone": "",
                "LandlinePhone": origin.phone1,
                "CellPhone": (_z = origin === null || origin === void 0 ? void 0 : origin.phon2) !== null && _z !== void 0 ? _z : "",
                "ContacteMail": origin.email,
                "Latitude": 99999.99,
                "Longitude": 99999.99,
                "IsActive": "True",
                "recipient": {
                    "eMailClient": destination.email, //email del destinatario
                    "isPudo": servicesFind.isPudo ? "1" : "0",
                    "EquivalentCode": servicesFind.isPudo ? (_1 = (_0 = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.EquivalentCode : "",
                    "TyoeLocationName": servicesFind.isPudo ? (_3 = (_2 = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _2 === void 0 ? void 0 : _2[0]) === null || _3 === void 0 ? void 0 : _3.SpaceOwnerName : "",
                    "SpaceOwnerName": servicesFind.isPudo ? (_5 = (_4 = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.OwnerCode : "",
                    "isSender": "0",
                    "Alias": destination.alias,
                    "TaxPayer": "",
                    "CompleteName": `${(_6 = destination === null || destination === void 0 ? void 0 : destination.firstName) !== null && _6 !== void 0 ? _6 : ""} ${(_7 = destination === null || destination === void 0 ? void 0 : destination.lastName) !== null && _7 !== void 0 ? _7 : ""} ${(_8 = destination === null || destination === void 0 ? void 0 : destination.middleName) !== null && _8 !== void 0 ? _8 : ""}`,
                    "zipCode": destination.postalCode,
                    "roadTypeCode": "",
                    "roadTypeName": destination.road,
                    "street": destination.street,
                    "externalNum": destination.exteriorNumber,
                    "indoreInformation": (_9 = destination === null || destination === void 0 ? void 0 : destination.interiorNumber) !== null && _9 !== void 0 ? _9 : "",
                    "settlementTypeCode": "",
                    "settlementTypeName": destination.settlement,
                    "SettlementTypeAbbName": destination.settlement.slice(0, 3),
                    "settlementName": destination.neighborhood,
                    "twnshipCode": "",
                    "twnshipName": destination.city,
                    "stateCode": destination.stateCode,
                    "stateName": destination.state,
                    "countryCode": destination.countryCodeAlfa2 ? destination.countryCodeAlfa2 : "MX",
                    "countryCodeAlfa3": destination.countryCodeAlfa3 && destination.countryCodeAlfa3 !== "" ? destination.countryCodeAlfa3 : "MEX",
                    "countryName": destination.country && destination.country !== "MX" ? destination.country : "México",
                    "betweenRoadName1": (_10 = betweenRoadsDestination[0]) !== null && _10 !== void 0 ? _10 : ((destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) == " y " ? "" : ""),
                    "betweenRoadName2": (_11 = betweenRoadsDestination[1]) !== null && _11 !== void 0 ? _11 : "",
                    "AddressReference": (_12 = destination === null || destination === void 0 ? void 0 : destination.reference) !== null && _12 !== void 0 ? _12 : "",
                    "CountryCodePhone": "",
                    "LandlinePhone": destination.phone1,
                    "CellPhone": (_13 = destination === null || destination === void 0 ? void 0 : destination.phon2) !== null && _13 !== void 0 ? _13 : "",
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
