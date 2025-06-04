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
const customObjectsFunction_1 = require("../../utils/customObjectsFunction");
const router = (0, express_1.Router)();
router.get("/pdv-services", token_1.validateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
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
    let searchOrder = {};
    let userId = "";
    if (order.body.hits.length <= 0) {
        //@ts-ignore
        const order = yield (0, customObjectsFunction_1.getCustomObjectByQr)(qr);
        searchOrder = order.order;
        userId = order.user;
    }
    else {
        const getOrder = yield client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute();
        if (!getOrder.statusCode || getOrder.statusCode >= 300)
            return res.sendStatus(404);
        searchOrder = getOrder.body;
        userId = (_a = searchOrder === null || searchOrder === void 0 ? void 0 : searchOrder.customerId) !== null && _a !== void 0 ? _a : "";
    }
    console.log(searchOrder.id);
    const customer = yield client_1.apiRoot.customers().withId({ ID: userId }).get().execute();
    const customObject = ((_b = searchOrder.custom) === null || _b === void 0 ? void 0 : _b.fields["services"]) && JSON.parse(searchOrder.custom.fields["services"]);
    let servicesFind;
    try {
        const lineItems = searchOrder.lineItems.filter(item => { var _a, _b; return (_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0; });
        for (const line of lineItems) {
            servicesFind = customObject[line.id].find((item) => item.QR == qr);
            console.log(servicesFind);
            if (servicesFind)
                break;
        }
    }
    catch (err) {
        const lineItems = searchOrder.lineItems.filter(item => { var _a, _b; return (_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0; });
        for (const line of lineItems) {
            servicesFind = customObject[line.id].guides.find((item) => item.QR == qr);
            if (servicesFind)
                break;
        }
    }
    console.log(servicesFind);
    const { origin, destination } = servicesFind.address;
    const betweenRoadsOrigin = ((_c = origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) === null || _c === void 0 ? void 0 : _c.includes("?")) ? origin.optionalAddress1.split("?") : [origin.optionalAddress1];
    const betweenRoadsDestination = ((_d = destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) === null || _d === void 0 ? void 0 : _d.includes("?")) ? destination.optionalAddress1.split("?") : [destination.optionalAddress1];
    const responseObject = {
        "pdvService": {
            "storeServiceOrder": searchOrder.id,
            "PurchaseOrder": (_h = (_e = searchOrder.orderNumber) !== null && _e !== void 0 ? _e : (_g = (_f = searchOrder.custom) === null || _f === void 0 ? void 0 : _f.fields) === null || _g === void 0 ? void 0 : _g["pickupNumber"]) !== null && _h !== void 0 ? _h : "",
            "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.guide,
            "idcaStoreClient": searchOrder.customerId,
            "eMailClient": customer.body.email,
            "idcaServiceWarranty": servicesFind.guide[13],
            "idcaServiceModality": servicesFind.guide[14],
            "isPudo": servicesFind.isPudo ? "1" : "0",
            "isPackage": servicesFind.isPackage ? "1" : "0",
            "itemLength": (_j = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemLength) !== null && _j !== void 0 ? _j : "",
            "itemHeight": (_k = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemHeight) !== null && _k !== void 0 ? _k : "",
            "itemWidth": (_l = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWidth) !== null && _l !== void 0 ? _l : "",
            "itemVolumen": (_m = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemVolumen) !== null && _m !== void 0 ? _m : "",
            "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
            "itemWeight": (_o = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWeight) !== null && _o !== void 0 ? _o : "",
            "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
            "statusServiceOrder": (_p = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) !== null && _p !== void 0 ? _p : "DISPONIBLE",
            "QRCode": "", // Vacio
            "QRCodeMD5": servicesFind.QR,
            "TarriffFractionCode": "0",
            "consultaId": "99999999", /// Revisarlo con Memo
            "createdDate": (0, formaterDate_1.FormaterDate)(searchOrder.createdAt, false),
            "availabledDate": `${(0, formaterDate_1.FormaterDate)(new Date(searchOrder.createdAt).toISOString(), false)} - ${(0, formaterDate_1.FormaterDate)(new Date(new Date(searchOrder.createdAt).setDate(new Date(searchOrder.createdAt).getDate() + 30)).toISOString(), false)}`,
            "sender": {
                "eMailClient": origin.email, //email del remitente
                "isPudo": origin.isPudo ? "1" : "0",
                "EquivalentCode": "",
                "TyoeLocationName": "",
                "SpaceOwnerName": "",
                "isSender": "1",
                "Alias": origin.alias,
                "TaxPayer": "",
                "CompleteName": `${(_q = origin === null || origin === void 0 ? void 0 : origin.firstName) !== null && _q !== void 0 ? _q : ""} ${(_r = origin === null || origin === void 0 ? void 0 : origin.lastName) !== null && _r !== void 0 ? _r : ""} ${(_s = origin === null || origin === void 0 ? void 0 : origin.middleName) !== null && _s !== void 0 ? _s : ""}`,
                "zipCode": origin.postalCode,
                "roadTypeCode": "9999",
                "roadTypeName": origin.road,
                "street": origin.street,
                "externalNum": origin.exteriorNumber,
                "indoreInformation": (_t = origin === null || origin === void 0 ? void 0 : origin.interiorNumber) !== null && _t !== void 0 ? _t : "",
                "settlementTypeCode": "999",
                "settlementTypeName": origin === null || origin === void 0 ? void 0 : origin.settlement,
                "SettlementTypeAbbName": (_u = origin === null || origin === void 0 ? void 0 : origin.settlement) === null || _u === void 0 ? void 0 : _u.slice(0, 3),
                "settlementName": origin.neighborhood,
                "twnshipCode": "",
                "twnshipName": origin.city,
                "stateCode": origin.stateCode,
                "stateName": origin.state,
                "countryCode": "MX",
                "countryCodeAlfa3": "MEX",
                "countryName": "México",
                "betweenRoadName1": (_v = betweenRoadsOrigin[0]) !== null && _v !== void 0 ? _v : ((origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) == " y " ? "" : ""),
                "betweenRoadName2": (_w = betweenRoadsOrigin[1]) !== null && _w !== void 0 ? _w : " ",
                "AddressReference": (_x = origin === null || origin === void 0 ? void 0 : origin.reference) !== null && _x !== void 0 ? _x : "",
                "CountryCodePhone": "",
                "LandlinePhone": origin.phone1,
                "CellPhone": (_y = origin === null || origin === void 0 ? void 0 : origin.phon2) !== null && _y !== void 0 ? _y : "",
                "ContacteMail": origin.email,
                "Latitude": 99999.99,
                "Longitude": 99999.99,
                "IsActive": "True",
                "recipient": {
                    "eMailClient": destination.email, //email del destinatario
                    "isPudo": servicesFind.isPudo ? "1" : "0",
                    "EquivalentCode": servicesFind.isPudo ? (_0 = (_z = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _z === void 0 ? void 0 : _z[0]) === null || _0 === void 0 ? void 0 : _0.EquivalentCode : "",
                    "TyoeLocationName": servicesFind.isPudo ? (_2 = (_1 = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _1 === void 0 ? void 0 : _1[0]) === null || _2 === void 0 ? void 0 : _2.SpaceOwnerName : "",
                    "SpaceOwnerName": servicesFind.isPudo ? (_4 = (_3 = destination === null || destination === void 0 ? void 0 : destination.pudoinfo) === null || _3 === void 0 ? void 0 : _3[0]) === null || _4 === void 0 ? void 0 : _4.OwnerCode : "",
                    "isSender": "0",
                    "Alias": destination.alias,
                    "TaxPayer": "",
                    "CompleteName": `${(_5 = destination === null || destination === void 0 ? void 0 : destination.firstName) !== null && _5 !== void 0 ? _5 : ""} ${(_6 = destination === null || destination === void 0 ? void 0 : destination.lastName) !== null && _6 !== void 0 ? _6 : ""} ${(_7 = destination === null || destination === void 0 ? void 0 : destination.middleName) !== null && _7 !== void 0 ? _7 : ""}`,
                    "zipCode": destination.postalCode,
                    "roadTypeCode": "",
                    "roadTypeName": destination.road,
                    "street": destination.street,
                    "externalNum": destination.exteriorNumber,
                    "indoreInformation": (_8 = destination === null || destination === void 0 ? void 0 : destination.interiorNumber) !== null && _8 !== void 0 ? _8 : "",
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
                    "betweenRoadName1": (_9 = betweenRoadsDestination[0]) !== null && _9 !== void 0 ? _9 : ((destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) == " y " ? "" : ""),
                    "betweenRoadName2": (_10 = betweenRoadsDestination[1]) !== null && _10 !== void 0 ? _10 : "",
                    "AddressReference": (_11 = destination === null || destination === void 0 ? void 0 : destination.reference) !== null && _11 !== void 0 ? _11 : "",
                    "CountryCodePhone": "",
                    "LandlinePhone": destination.phone1,
                    "CellPhone": (_12 = destination === null || destination === void 0 ? void 0 : destination.phon2) !== null && _12 !== void 0 ? _12 : "",
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
