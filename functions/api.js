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
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const cors_1 = __importDefault(require("cors"));
// import data from './mock_values.json' assert { type: 'json'}
const client_1 = require("./commercetools/client");
const validate_1 = require("./validateDate/validate");
const token_1 = require("./jsonToken/token");
const formaterDate_1 = require("./utils/formaterDate");
const orderstoNotify = {};
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const router = express_1.default.Router();
router.get("/", function (req, res) {
    res.sendStatus(200);
});
const addObject = (index, order, days) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const customer = yield client_1.apiRoot.customers().withId({ ID: (_a = order.customerId) !== null && _a !== void 0 ? _a : "" }).get().execute();
        if (!customer.statusCode || customer.statusCode >= 300)
            return;
        const products = [];
        for (const item of order.lineItems) {
            products.push(`(${item.quantity})${item.name["es-MX"]}`);
        }
        const date = new Date(order.createdAt);
        date.setDate(date.getDate() + 426);
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        // Formatear la fecha 
        // @ts-ignore
        const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
        orderstoNotify[index] = {
            emailClient: customer.body.email,
            clientName: (_g = (_e = (_c = (_b = customer.body) === null || _b === void 0 ? void 0 : _b.firstName) !== null && _c !== void 0 ? _c : "" + ((_d = customer.body) === null || _d === void 0 ? void 0 : _d.lastName)) !== null && _e !== void 0 ? _e : "" + ((_f = customer.body) === null || _f === void 0 ? void 0 : _f.middleName)) !== null && _g !== void 0 ? _g : "",
            folios: products.join(","),
            expirationDate: fechaFormateada,
            expirationDays: days
        };
    }
    catch (err) {
        console.log(err.message);
        return;
    }
});
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
/// authenticacion por AUTH 2.0
//
router.get("/lifetimes", token_1.validateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const endDate = req.headers.date;
    /// Traer ordenes de tipo Combo
    /// Verificar que ordenes caen en los periodos de notificación:
    /// 1. 3 meses - antiguedad de la orden sea de 12M
    /// 2. 1 mese - antiguedad de la orden sea de 13M
    /// 3. 15 días - antiguedad de la orden sea de 13M y 15d
    /// 4. 7 días - antiguedad de la orden sea de 13M y 21d
    /// 5. 1 día antiguedad de la orden sea de 13M y 29d
    /// Obtener datos del cliente
    /// armas la estructura de coleccion (data.items)
    //
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            limit: 500,
            sort: "createdAt desc",
            where: 'custom(fields(type-order="service"))',
        }
    }).execute();
    if (orders.body.results.length <= 0)
        return res.sendStatus(204);
    //@ts-ignore
    const ordersCombo = orders.body.results.filter(order => order.lineItems.some(item => { var _a; return (_a = item.variant) === null || _a === void 0 ? void 0 : _a.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA"); }));
    for (const order of ordersCombo) {
        const daysDif = (0, validate_1.checkDate)(order.createdAt, endDate);
        console.log(daysDif);
        switch (daysDif) {
            case 365:
                const orders = yield client_1.apiRoot.orders().withId({ ID: order.id }).post({
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
                }).execute();
                yield addObject(daysDif, order, 90);
                break;
            case 395:
                yield addObject(daysDif, order, 30);
                break;
            case 411:
                yield addObject(daysDif, order, 15);
                break;
            case 417:
                yield addObject(daysDif, order, 7);
                break;
            case 424:
                yield addObject(daysDif, order, 1);
                break;
        }
    }
    return res.status(200).send({
        statusCode: 200,
        body: orderstoNotify,
    });
}));
router.get("/pdv-services", token_1.validateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const qr = req.headers.qr;
    /// Obtener el QR de una variable en el header
    /// Obtener orden de CT con query de QR
    /// Generar la estructura de data.pdvService
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
    //Disponible y cancelado no se muestra el waybill
    const responseObject = {
        "pdvService": {
            "storeServiceOrder": "999-999999",
            "PurchaseOrder": (_g = (_d = searchOrder.body.orderNumber) !== null && _d !== void 0 ? _d : (_f = (_e = searchOrder.body.custom) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f["pickupNumber"]) !== null && _g !== void 0 ? _g : "",
            "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind === null || servicesFind === void 0 ? void 0 : servicesFind.guide,
            "idcaStoreClient": 1234567890,
            "eMailClient": customer.body.email,
            "idcaServiceWarranty": "123",
            "idcaServiceModality": "123",
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
                "settlementName": "La Patera Vallejo",
                "twnshipCode": "999",
                "twnshipName": "Gustavo A Madero",
                "stateCode": origin.postalCode,
                "stateName": origin.state,
                "countryCode": "999",
                "countryCodeAlfa3": "MEX",
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
                    "EquivalentCode": "123",
                    "TyoeLocationName": "Nombre del Pudo",
                    "SpaceOwnerName": "Tipo de pudo",
                    "isSender": "0",
                    "Alias": "",
                    "TaxPayer": "",
                    "CompleteName": (_y = (_x = (_w = destination === null || destination === void 0 ? void 0 : destination.firstName) !== null && _w !== void 0 ? _w : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.lastName)) !== null && _x !== void 0 ? _x : "" + " " + (destination === null || destination === void 0 ? void 0 : destination.middleName)) !== null && _y !== void 0 ? _y : "",
                    "zipCode": destination.postalCode,
                    "roadTypeCode": "9999",
                    "roadTypeName": destination.road,
                    "street": destination.street,
                    "externalNum": destination.exteriorNumber,
                    "indoreInformation": (_z = destination === null || destination === void 0 ? void 0 : destination.interiorNumber) !== null && _z !== void 0 ? _z : "",
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
                    "betweenRoadName1": (_0 = destination === null || destination === void 0 ? void 0 : destination.optionalAddress1) !== null && _0 !== void 0 ? _0 : "",
                    "betweenRoadName2": "y" + " " + (destination === null || destination === void 0 ? void 0 : destination.optionalAddress2),
                    "AddressReference": (_1 = destination === null || destination === void 0 ? void 0 : destination.reference) !== null && _1 !== void 0 ? _1 : "",
                    "CountryCodePhone": "999",
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
router.post("/waybills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { WaybillService } = req.body;
    const isValid = validateWaybillRequest(WaybillService);
    if (!isValid) {
        return res.status(400).send({ message: 'Invalid WaybillService format.' });
    }
    let resulWaylBill = [];
    for (const wayBillItem of WaybillService) {
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
        console.log(customObject);
        let servicesFind;
        try {
            servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item) => item.QR == wayBillItem.qr);
        }
        catch (err) {
            servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item) => item.QR == wayBillItem.qr);
        }
        if (!servicesFind.status) {
            servicesFind.status = "EN PROCESO";
        }
        else {
            resulWaylBill.push({
                "resultCode": "1",
                "resultDescription": "Proceso no completado",
                "ResultWaybill": servicesFind.guide,
            });
            continue;
        }
        console.log("Response", customObject);
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
    console.log("PUT");
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
            servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item) => item.QR == wayBillItem.qr);
        }
        catch (err) {
            servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item) => item.QR == wayBillItem.qr);
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
    /// Cambiar el estado de la guia 
    /// Devolverla a la orden original
    /// Crear la estructura de data.WaybillStatusChanged
    res.status(200).json(resulWaylBill[0]);
}));
router.get("/ordersExpired/:idCustomer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const idCustomer = req.params.idCustomer;
    if (!idCustomer)
        return res.status(400).send({ message: 'idCustomer is required' });
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            where: `custom(fields(isExpired=true)) and customerId in ("${idCustomer}")`
        }
    }).execute();
    if (!orders.statusCode || orders.statusCode >= 300)
        return res.sendStatus(404);
    return res.status(200).send({
        message: '',
        ordersToExpired: (_b = (_a = orders.body) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0
    });
}));
router.post("/payment/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    return res.sendStatus(200);
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');
    if (!clientId || !clientSecret) {
        return res.status(401).send({ message: 'Por favor provee credenciales validos para su autenticacion' });
    }
    if (clientId != "wjg14gn3zqm34q8srm2htj" || clientSecret != "gu1vr46nc4pl87") {
        return res.status(401).send({ message: "Credenciales no validas" });
    }
    const token = (0, token_1.generateToken)(clientId, clientSecret);
    return res.status(201).send({
        access_token: token,
        token
    });
}));
app.use('/.netlify/functions/api', router);
const port = process.env.PORT || 9000;
exports.handler = (0, serverless_http_1.default)(app);
app.listen(port, () => {
    console.log("Server listenning on port" + port);
});
