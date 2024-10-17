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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var express_1 = __importDefault(require("express"));
var serverless_http_1 = __importDefault(require("serverless-http"));
var cors_1 = __importDefault(require("cors"));
// import data from './mock_values.json' assert { type: 'json'}
var client_1 = require("./commercetools/client");
var validate_1 = require("./functions/validateDate/validate");
var token_1 = require("./jsonToken/token");
var formaterDate_1 = require("./utils/formaterDate");
var orderstoNotify = {};
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
var router = express_1.default.Router();
router.get("/", function (_, res) {
    res.sendStatus(200);
});
var addObject = function (index, order, days) { return __awaiter(void 0, void 0, void 0, function () {
    var customer, products, _i, _a, item, date, opciones, fechaFormateada, err_1;
    var _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                _j.trys.push([0, 2, , 3]);
                return [4 /*yield*/, client_1.apiRoot.customers().withId({ ID: (_b = order.customerId) !== null && _b !== void 0 ? _b : "" }).get().execute()];
            case 1:
                customer = _j.sent();
                if (!customer.statusCode || customer.statusCode >= 300)
                    return [2 /*return*/];
                products = [];
                for (_i = 0, _a = order.lineItems; _i < _a.length; _i++) {
                    item = _a[_i];
                    products.push("(".concat(item.quantity, ")").concat(item.name["es-MX"]));
                }
                date = new Date(order.createdAt);
                date.setDate(date.getDate() + 426);
                opciones = { year: 'numeric', month: 'long', day: 'numeric' };
                fechaFormateada = date.toLocaleDateString('es-ES', opciones);
                orderstoNotify[index].push({
                    emailClient: customer.body.email,
                    clientName: (_h = (_f = (_d = (_c = customer.body) === null || _c === void 0 ? void 0 : _c.firstName) !== null && _d !== void 0 ? _d : "" + ((_e = customer.body) === null || _e === void 0 ? void 0 : _e.lastName)) !== null && _f !== void 0 ? _f : "" + ((_g = customer.body) === null || _g === void 0 ? void 0 : _g.middleName)) !== null && _h !== void 0 ? _h : "",
                    folios: products.join(","),
                    expirationDate: fechaFormateada,
                    expirationDays: days
                });
                return [3 /*break*/, 3];
            case 2:
                err_1 = _j.sent();
                return [2 /*return*/];
            case 3: return [2 /*return*/];
        }
    });
}); };
var validateWaybillRequest = function (waybillService) {
    var isValid = waybillService.every(function (service) {
        return typeof service.storePortalOrder === 'string' &&
            typeof service.storeFolioOrder === 'string' &&
            typeof service.eMailClient === 'string' &&
            typeof service.serviceWarranty === 'string' &&
            typeof service.serviceModality === 'string' &&
            typeof service.waybill === 'string' &&
            typeof service.statusFolioOrder === 'string' &&
            typeof service.usedDate === 'string' &&
            typeof service.IsGenerator === 'boolean';
    });
    return isValid;
};
/// authenticacion por AUTH 2.0
//
router.get("/lifetimes", token_1.validateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var endDate, orders, ordersCombo, _i, ordersCombo_1, order, daysDif, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                endDate = req.headers.date;
                return [4 /*yield*/, client_1.apiRoot.orders().get({
                        queryArgs: {
                            limit: 500,
                            sort: "createdAt desc",
                            where: 'custom(fields(type-order="service"))',
                        }
                    }).execute()];
            case 1:
                orders = _b.sent();
                if (orders.body.results.length <= 0)
                    return [2 /*return*/, res.sendStatus(204)
                        //@ts-ignore
                    ];
                ordersCombo = orders.body.results.filter(function (order) { return order.lineItems.some(function (item) { var _a; return (_a = item.variant) === null || _a === void 0 ? void 0 : _a.attributes.some(function (attr) { return attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA"; }); }); });
                _i = 0, ordersCombo_1 = ordersCombo;
                _b.label = 2;
            case 2:
                if (!(_i < ordersCombo_1.length)) return [3 /*break*/, 15];
                order = ordersCombo_1[_i];
                daysDif = (0, validate_1.checkDate)(order.createdAt, endDate);
                _a = daysDif;
                switch (_a) {
                    case 365: return [3 /*break*/, 3];
                    case 395: return [3 /*break*/, 6];
                    case 411: return [3 /*break*/, 8];
                    case 417: return [3 /*break*/, 10];
                    case 424: return [3 /*break*/, 12];
                }
                return [3 /*break*/, 14];
            case 3: return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: order.id }).post({
                    body: {
                        version: order.version,
                        actions: [
                            {
                                action: 'setCustomField',
                                name: 'isExpired',
                                value: true,
                            }
                        ]
                    }
                }).execute()];
            case 4:
                _b.sent();
                return [4 /*yield*/, addObject(daysDif, order, 90)];
            case 5:
                _b.sent();
                return [3 /*break*/, 14];
            case 6: return [4 /*yield*/, addObject(daysDif, order, 30)];
            case 7:
                _b.sent();
                return [3 /*break*/, 14];
            case 8: return [4 /*yield*/, addObject(daysDif, order, 15)];
            case 9:
                _b.sent();
                return [3 /*break*/, 14];
            case 10: return [4 /*yield*/, addObject(daysDif, order, 7)];
            case 11:
                _b.sent();
                return [3 /*break*/, 14];
            case 12: return [4 /*yield*/, addObject(daysDif, order, 1)];
            case 13:
                _b.sent();
                return [3 /*break*/, 14];
            case 14:
                _i++;
                return [3 /*break*/, 2];
            case 15: return [2 /*return*/, res.status(200).send({
                    statusCode: 200,
                    body: orderstoNotify,
                })];
        }
    });
}); });
router.get("/pdv-services", token_1.validateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var qr, order, searchOrder, customer, customObject, servicesFind, _a, origin, destination, responseObject;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    return __generator(this, function (_4) {
        switch (_4.label) {
            case 0:
                qr = req.headers.qr;
                /// Obtener el QR de una variable en el header
                /// Obtener orden de CT con query de QR
                /// Generar la estructura de data.pdvService
                if (!qr || qr == '')
                    return [2 /*return*/, res.sendStatus(404)];
                return [4 /*yield*/, client_1.apiRoot.orders().search().post({
                        body: {
                            query: {
                                fullText: {
                                    field: "custom.services",
                                    value: qr,
                                    customType: "StringType"
                                }
                            }
                        }
                    }).execute()];
            case 1:
                order = _4.sent();
                if (order.body.hits.length <= 0)
                    return [2 /*return*/, res.sendStatus(404)];
                return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute()];
            case 2:
                searchOrder = _4.sent();
                if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
                    return [2 /*return*/, res.sendStatus(404)];
                return [4 /*yield*/, client_1.apiRoot.customers().withId({ ID: (_c = (_b = searchOrder.body) === null || _b === void 0 ? void 0 : _b.customerId) !== null && _c !== void 0 ? _c : "" }).get().execute()];
            case 3:
                customer = _4.sent();
                customObject = ((_d = searchOrder.body.custom) === null || _d === void 0 ? void 0 : _d.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
                try {
                    servicesFind = customObject[searchOrder.body.lineItems[0].id].find(function (item) { return item.QR == qr; });
                }
                catch (err) {
                    servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find(function (item) { return item.QR == qr; });
                }
                console.log(servicesFind);
                _a = servicesFind.address, origin = _a.origin, destination = _a.destination;
                responseObject = {
                    "pdvService": {
                        "storeServiceOrder": "999-999999",
                        "PurchaseOrder": (_h = (_e = searchOrder.body.orderNumber) !== null && _e !== void 0 ? _e : (_g = (_f = searchOrder.body.custom) === null || _f === void 0 ? void 0 : _f.fields) === null || _g === void 0 ? void 0 : _g["pickupNumber"]) !== null && _h !== void 0 ? _h : "",
                        "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.guide,
                        "idcaStoreClient": 1234567890,
                        "eMailClient": customer.body.email,
                        "idcaServiceWarranty": "123",
                        "idcaServiceModality": "123",
                        "isPudo": servicesFind.isPudo ? "1" : "0",
                        "isPackage": servicesFind.isPackage ? "1" : "0",
                        "itemLength": (_j = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemLength) !== null && _j !== void 0 ? _j : "",
                        "itemHeight": (_k = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemHeight) !== null && _k !== void 0 ? _k : "",
                        "itemWidth": (_l = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWidth) !== null && _l !== void 0 ? _l : "",
                        "itemVolumen": (_m = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemVolumen) !== null && _m !== void 0 ? _m : "",
                        "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
                        "itemWeight": (_o = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.itemWeight) !== null && _o !== void 0 ? _o : "",
                        "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
                        "statusServiceOrder": (_p = servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.status) !== null && _p !== void 0 ? _p : "",
                        "QRCode": "", // Vacio
                        "QRCodeMD5": servicesFind.QR,
                        "TarriffFractionCode": "0",
                        "consultaId": "99999999", /// Revisarlo con Memo
                        "createdDate": (0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false),
                        "availabledDate": "".concat((0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false), " - ").concat((0, formaterDate_1.FormaterDate)(searchOrder.body.createdAt, false)),
                        "sender": {
                            "eMailClient": origin.email, //email del remitente
                            "isPudo": "0",
                            "EquivalentCode": "123",
                            "TyoeLocationName": "Nombre del Pudo",
                            "SpaceOwnerName": "Tipo de pudo",
                            "isSender": "0",
                            "Alias": "",
                            "TaxPayer": "",
                            "CompleteName": (_s = (_r = (_q = origin === null || origin === void 0 ? void 0 : origin.firstName) !== null && _q !== void 0 ? _q : "" + " " + (origin === null || origin === void 0 ? void 0 : origin.lastName)) !== null && _r !== void 0 ? _r : "" + " " + (origin === null || origin === void 0 ? void 0 : origin.middleName)) !== null && _s !== void 0 ? _s : "",
                            "zipCode": origin.postalCode,
                            "roadTypeCode": "9999",
                            "roadTypeName": origin.road,
                            "street": origin.street,
                            "externalNum": origin.exteriorNumber,
                            "indoreInformation": (_t = origin === null || origin === void 0 ? void 0 : origin.interiorNumber) !== null && _t !== void 0 ? _t : "",
                            "settlementTypeCode": "999",
                            "settlementTypeName": origin.settlement,
                            "SettlementTypeAbbName": origin.settlement.slice(0, 3),
                            "settlementName": "La Patera Vallejo",
                            "twnshipCode": "999",
                            "twnshipName": "Gustavo A Madero",
                            "stateCode": origin.postalCode,
                            "stateName": origin.state,
                            "countryCode": "999",
                            "countryCodeAlfa3": "MEX",
                            "countryName": origin.country,
                            "betweenRoadName1": (_u = origin === null || origin === void 0 ? void 0 : origin.optionalAddress1) !== null && _u !== void 0 ? _u : "",
                            "betweenRoadName2": "y" + " " + (origin === null || origin === void 0 ? void 0 : origin.optionalAddress2),
                            "AddressReference": (_v = origin === null || origin === void 0 ? void 0 : origin.reference) !== null && _v !== void 0 ? _v : "",
                            "CountryCodePhone": "999",
                            "LandlinePhone": origin.phone1,
                            "CellPhone": (_w = origin === null || origin === void 0 ? void 0 : origin.phon2) !== null && _w !== void 0 ? _w : "",
                            "ContacteMail": origin.email,
                            "Latitude": 99999.99,
                            "Longitude": 99999.99,
                            "IsActive": "True",
                            "recipient": {
                                "eMailClient": destination.email, //email del destinatario
                                "isPudo": "0",
                                "EquivalentCode": "123",
                                "TyoeLocationName": "Nombre del Pudo",
                                "SpaceOwnerName": "Tipo de pudo",
                                "isSender": "0",
                                "Alias": "",
                                "TaxPayer": "",
                                "CompleteName": (_z = (_y = (_x = destination === null || destination === void 0 ? void 0 : destination.firstName) !== null && _x !== void 0 ? _x : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.lastName)) !== null && _y !== void 0 ? _y : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.middleName)) !== null && _z !== void 0 ? _z : "",
                                "zipCode": destination.postalCode,
                                "roadTypeCode": "9999",
                                "roadTypeName": destination.road,
                                "street": destination.street,
                                "externalNum": destination.exteriorNumber,
                                "indoreInformation": (_0 = destination === null || destination === void 0 ? void 0 : destination.interiorNumber) !== null && _0 !== void 0 ? _0 : "",
                                "settlementTypeCode": "999",
                                "settlementTypeName": destination.settlement,
                                "SettlementTypeAbbName": destination.settlement.slice(0, 3),
                                "settlementName": "La Patera Vallejo",
                                "twnshipCode": "999",
                                "twnshipName": "Gustavo A Madero",
                                "stateCode": destination.postalCode,
                                "stateName": destination.state,
                                "countryCode": "999",
                                "countryCodeAlfa3": "MEX",
                                "countryName": destination.country,
                                "betweenRoadName1": (_1 = destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) !== null && _1 !== void 0 ? _1 : "",
                                "betweenRoadName2": "y" + " " + (destination === null || destination === void 0 ? void 0 : destination.optionalAddress2),
                                "AddressReference": (_2 = destination === null || destination === void 0 ? void 0 : destination.reference) !== null && _2 !== void 0 ? _2 : "",
                                "CountryCodePhone": "999",
                                "LandlinePhone": destination.phone1,
                                "CellPhone": (_3 = destination === null || destination === void 0 ? void 0 : destination.phon2) !== null && _3 !== void 0 ? _3 : "",
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
                return [2 /*return*/];
        }
    });
}); });
router.post("/waybills", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var WaybillService, isValid, resulWaylBill, _loop_1, _i, WaybillService_1, wayBillItem, state_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                WaybillService = req.body.WaybillService;
                isValid = validateWaybillRequest(WaybillService);
                if (!isValid) {
                    return [2 /*return*/, res.status(400).send({ message: 'Invalid WaybillService format.' })];
                }
                resulWaylBill = [];
                _loop_1 = function (wayBillItem) {
                    var order, searchOrder, customObject, servicesFind;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, client_1.apiRoot.orders().search().post({
                                    body: {
                                        query: {
                                            fullText: {
                                                field: "custom.services",
                                                value: wayBillItem.qr,
                                                customType: "StringType"
                                            }
                                        }
                                    }
                                }).execute()];
                            case 1:
                                order = _c.sent();
                                return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute()];
                            case 2:
                                searchOrder = _c.sent();
                                if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
                                    return [2 /*return*/, { value: res.sendStatus(404) }];
                                customObject = ((_a = searchOrder.body.custom) === null || _a === void 0 ? void 0 : _a.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
                                console.log(customObject);
                                servicesFind = customObject[searchOrder.body.lineItems[0].id].find(function (item) { return item.QR == wayBillItem.qr; });
                                if (!servicesFind.status) {
                                    servicesFind.status = "EN PROCESO";
                                }
                                else {
                                    resulWaylBill.push({
                                        "resultCode": "1",
                                        "resultDescription": "Proceso no completado",
                                        "ResultWaybill": servicesFind.guide,
                                    });
                                    return [2 /*return*/, "continue"];
                                }
                                console.log("Response", customObject);
                                resulWaylBill.push({
                                    "resultCode": "0",
                                    "resultDescription": "Proceso completo",
                                    "ResultWaybill": servicesFind.guide,
                                });
                                return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: searchOrder.body.id }).post({
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
                                    }).execute()];
                            case 3:
                                _c.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, WaybillService_1 = WaybillService;
                _b.label = 1;
            case 1:
                if (!(_i < WaybillService_1.length)) return [3 /*break*/, 4];
                wayBillItem = WaybillService_1[_i];
                return [5 /*yield**/, _loop_1(wayBillItem)];
            case 2:
                state_1 = _b.sent();
                if (typeof state_1 === "object")
                    return [2 /*return*/, state_1.value];
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                //Si esta disonible cambiar a enproceso y retornar datos del waybill
                /// Extraer la guia disponible de las ordenes de combo
                /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
                /// Crear la estructura de data.WaybillService
                res.status(200).json(resulWaylBill[0]);
                return [2 /*return*/];
        }
    });
}); });
router.put("/waybills", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var AsignWaybillOrder, isValid, resulWaylBill, _loop_2, _i, AsignWaybillOrder_1, wayBillItem, state_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                AsignWaybillOrder = req.body.AsignWaybillOrder;
                console.log("PUT");
                isValid = validateWaybillRequest(AsignWaybillOrder);
                if (!isValid) {
                    return [2 /*return*/, res.status(400).send({ message: 'Invalid WaybillService format.' })];
                }
                resulWaylBill = [];
                _loop_2 = function (wayBillItem) {
                    var order, searchOrder, customObject, servicesFind;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, client_1.apiRoot.orders().search().post({
                                    body: {
                                        query: {
                                            fullText: {
                                                field: "custom.services",
                                                value: wayBillItem.qr,
                                                customType: "StringType"
                                            }
                                        }
                                    }
                                }).execute()];
                            case 1:
                                order = _c.sent();
                                return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: order.body.hits[0].id }).get().execute()];
                            case 2:
                                searchOrder = _c.sent();
                                if (!searchOrder.statusCode || searchOrder.statusCode >= 300)
                                    return [2 /*return*/, { value: res.sendStatus(404) }];
                                customObject = ((_a = searchOrder.body.custom) === null || _a === void 0 ? void 0 : _a.fields["services"]) && JSON.parse(searchOrder.body.custom.fields["services"]);
                                servicesFind = customObject[searchOrder.body.lineItems[0].id].find(function (item) { return item.QR == wayBillItem.qr; });
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
                                return [4 /*yield*/, client_1.apiRoot.orders().withId({ ID: searchOrder.body.id }).post({
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
                                    }).execute()];
                            case 3:
                                _c.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, AsignWaybillOrder_1 = AsignWaybillOrder;
                _b.label = 1;
            case 1:
                if (!(_i < AsignWaybillOrder_1.length)) return [3 /*break*/, 4];
                wayBillItem = AsignWaybillOrder_1[_i];
                return [5 /*yield**/, _loop_2(wayBillItem)];
            case 2:
                state_2 = _b.sent();
                if (typeof state_2 === "object")
                    return [2 /*return*/, state_2.value];
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                /// Cambiar el estado de la guia 
                /// Devolverla a la orden original
                /// Crear la estructura de data.WaybillStatusChanged
                res.status(200).json(resulWaylBill[0]);
                return [2 /*return*/];
        }
    });
}); });
router.get("/ordersExpired/:idCustomer", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var idCustomer, orders;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                idCustomer = req.params.idCustomer;
                if (!idCustomer)
                    return [2 /*return*/, res.status(400).send({ message: 'idCustomer is required' })];
                return [4 /*yield*/, client_1.apiRoot.orders().get({
                        queryArgs: {
                            where: "custom(fields(isExpired=true)) and customerId in (\"".concat(idCustomer, "\")")
                        }
                    }).execute()];
            case 1:
                orders = _c.sent();
                if (!orders.statusCode || orders.statusCode >= 300)
                    return [2 /*return*/, res.sendStatus(404)];
                return [2 /*return*/, res.status(200).send({
                        message: '',
                        ordersToExpired: (_b = (_a = orders.body) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0
                    })];
        }
    });
}); });
router.post("/payment/webhook", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log(req.body);
        return [2 /*return*/, res.sendStatus(200)];
    });
}); });
router.post("/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, base64Credentials, credentials, _a, clientId, clientSecret, token;
    return __generator(this, function (_b) {
        authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return [2 /*return*/, res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' })];
        }
        base64Credentials = authHeader.split(' ')[1];
        credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        _a = credentials.split(':'), clientId = _a[0], clientSecret = _a[1];
        if (!clientId || !clientSecret) {
            return [2 /*return*/, res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' })];
        }
        if (clientId != "wjg14gn3zqm34q8srm2htj" || clientSecret != "gu1vr46nc4pl87") {
            return [2 /*return*/, res.status(401).send({ message: "Credenciales no validas" })];
        }
        token = (0, token_1.generateToken)(clientId, clientSecret);
        return [2 /*return*/, res.status(201).send({
                access_token: token,
                token: token
            })];
    });
}); });
app.use('/.netlify/functions/api', router);
var port = process.env.PORT || 9000;
exports.handler = (0, serverless_http_1.default)(app);
app.listen(port, function () {
    console.log("Server listenning on port" + port);
});
