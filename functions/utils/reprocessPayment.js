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
exports.addPaymentToOrders = exports.reprocessPayment = void 0;
const client_1 = require("../commercetools/client");
const purchaseOrder_1 = require("../estafetaAPI/purchaseOrder");
const folios_1 = require("../estafetaAPI/folios");
const addPayment_1 = require("./addPayment");
const asignarGuides_1 = require("./asignarGuides");
const reprocessPayment = (idCart) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!idCart || idCart == "")
        return { response: "IdCart undefined", status: 500 };
    const getCart = yield client_1.apiRoot.carts().withId({ ID: idCart }).get().execute();
    if (!getCart.statusCode || getCart.statusCode >= 300)
        return { response: 'Cart not found', status: 404 };
    const customer = yield client_1.apiRoot.customers().withId({ ID: (_b = (_a = getCart.body) === null || _a === void 0 ? void 0 : _a.customerId) !== null && _b !== void 0 ? _b : "" }).get().execute();
    if (!customer.statusCode || customer.statusCode >= 300)
        return { response: 'Customer not found', status: 404 };
    const isRecoleccion = getCart.body.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "RECOLECCION"; });
    let response;
    console.log("Iniciando proceso");
    console.log("Cart", getCart.body.id);
    if (isRecoleccion) {
    }
    else {
        response = yield (0, exports.addPaymentToOrders)(getCart.body, customer.body);
        if ((response === null || response === void 0 ? void 0 : response.message) != "")
            return { response: response === null || response === void 0 ? void 0 : response.message, status: 500 };
    }
    return { response: response.orderId, status: 200 };
});
exports.reprocessPayment = reprocessPayment;
const generateId = (longitud = 20) => {
    const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < longitud; i++) {
        id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return id;
};
const addPaymentToOrders = (cart, customer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const quantityTotalGuides = 0;
    let versionCart = cart.version;
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            sort: `createdAt desc`,
            where: `orderNumber is defined`
        }
    }).execute();
    if (!orders.body.results[0].orderNumber)
        return;
    const orderSplit = orders.body.results[0].orderNumber.split('D');
    let newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
    const isZONA = cart.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA"; });
    const isUNIZONA = cart.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "UNIZONA"; });
    const isInternational = cart.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA INTERNACIONAL"; });
    console.log("Registrando pago en ct");
    const id = generateId();
    const createPayment = yield client_1.apiRoot.payments().post({
        body: {
            key: id,
            interfaceId: id,
            amountPlanned: {
                currencyCode: "MXN",
                centAmount: cart.totalPrice.centAmount | 0
            },
            paymentMethodInfo: {
                paymentInterface: "OPENPAY",
                method: "Tarjeta",
                name: {
                    "es-MX": "Tarjeta de Crédito"
                }
            },
            transactions: [
                {
                    interactionId: id,
                    type: "Charge",
                    amount: {
                        currencyCode: "MXN",
                        centAmount: cart.totalPrice.centAmount | 0,
                    },
                    state: "Success"
                }
            ]
        }
    }).execute();
    console.log("Pago registrado", createPayment.body.id);
    const createPurchaseOrder = () => __awaiter(void 0, void 0, void 0, function* () {
        const purchaseOrder = yield (0, purchaseOrder_1.WSPurchaseOrder)({ order: cart, code: newOrder, idPaymentService: id, methodName: "Openpay", customer, quantityTotalGuides });
        if (purchaseOrder.result.Code > 0) {
            if (purchaseOrder.result.Description.includes("REPEATED_TICKET")) {
                const orderSplit = newOrder.split('D');
                newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
                return yield createPurchaseOrder();
            }
            return {
                purchaseOrder: undefined,
                orderId: '',
                message: purchaseOrder.result.Description
            };
        }
        return {
            purchaseOrder: purchaseOrder,
            orderId: '',
            message: purchaseOrder.result.Description
        };
    });
    console.log("Insertando en purchase");
    const purchaseResult = yield createPurchaseOrder();
    if (!purchaseResult.purchaseOrder)
        return {
            message: purchaseResult.message,
            orderId: "",
            isRecoleccion: false,
            isUso: false
        };
    console.log("Purchase registrado");
    const purchaseOrder = purchaseResult.purchaseOrder;
    const codes = purchaseOrder.resultPurchaseOrder;
    let mapGuides;
    if (((_b = (_a = codes === null || codes === void 0 ? void 0 : codes[0]) === null || _a === void 0 ? void 0 : _a.WaybillList) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        const folios = yield (0, folios_1.CreateFolios)((_d = (_c = codes === null || codes === void 0 ? void 0 : codes[0]) === null || _c === void 0 ? void 0 : _c.WaybillList) === null || _d === void 0 ? void 0 : _d.length);
        mapGuides = (0, addPayment_1.createMapGuide)(codes, cart, folios.data.folioResult);
    }
    console.log("Folios registrados", mapGuides);
    // const setGuidesLines = await apiRoot.carts().withId({ ID: cart.body.id }).post({
    //   body: {
    //     version: versionCart,
    //     actions: [
    //       {
    //         action: "setLineItemCustomField",
    //         lineItemId: cart.body.lineItems.find(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA" || item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")?.id,
    //         name: "guia",
    //         value: JSON.stringify({codes})
    //       }
    //     ]
    //   }
    // }).execute()
    const userUpdated = yield client_1.apiRoot.customers().get({
        queryArgs: {
            where: `email in ("${customer.email}")`
        }
    }).execute();
    let versionCustomer = userUpdated.body.results[0].version;
    let objectCustomer = userUpdated.body.results[0];
    //Esto es para agregar items
    for (const line of cart.lineItems) {
        const attrType = (_f = (_e = line.variant.attributes) === null || _e === void 0 ? void 0 : _e.find(item => item.name == "tipo-paquete")) === null || _f === void 0 ? void 0 : _f.value["label"];
        if (attrType != "UNIZONA")
            continue;
        const attrQuantity = (_j = (_h = (_g = line.variant.attributes) === null || _g === void 0 ? void 0 : _g.find(item => item.name == "quantity-items")) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 1;
        const attrService = (_l = (_k = line.variant.attributes) === null || _k === void 0 ? void 0 : _k.find(item => item.name == "servicio")) === null || _l === void 0 ? void 0 : _l.value["label"];
        debugger;
        if (attrService == "DIA SIGUIENTE") {
            const quantityGuideAvailables = (_p = (_o = (_m = objectCustomer.custom) === null || _m === void 0 ? void 0 : _m.fields) === null || _o === void 0 ? void 0 : _o["quantity-guides-dia-siguiente"]) !== null && _p !== void 0 ? _p : 0;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-dia-siguiente",
                            value: quantityGuideAvailables + (attrQuantity * line.quantity)
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            objectCustomer = updateQuantityUser.body;
        }
        else if (attrService == "TERRESTRE") {
            const quantityGuideAvailables = (_s = (_r = (_q = objectCustomer.custom) === null || _q === void 0 ? void 0 : _q.fields) === null || _r === void 0 ? void 0 : _r["quantity-guides-terrestres"]) !== null && _s !== void 0 ? _s : 0;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-terrestres",
                            value: quantityGuideAvailables + (attrQuantity * line.quantity)
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            objectCustomer = updateQuantityUser.body;
        }
        else if (attrService == "DOS DIAS") {
            const quantityGuideAvailables = (_v = (_u = (_t = objectCustomer.custom) === null || _t === void 0 ? void 0 : _t.fields) === null || _u === void 0 ? void 0 : _u["quantity-guides-dos-dias"]) !== null && _v !== void 0 ? _v : 0;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-dos-dias",
                            value: quantityGuideAvailables + (attrQuantity * line.quantity)
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            objectCustomer = updateQuantityUser.body;
        }
        else if (attrService == "12:30") {
            const quantityGuideAvailables = (_y = (_x = (_w = objectCustomer.custom) === null || _w === void 0 ? void 0 : _w.fields) === null || _x === void 0 ? void 0 : _x["quantity-guides-doce-treinta"]) !== null && _y !== void 0 ? _y : 0;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-doce-treinta",
                            value: quantityGuideAvailables + (attrQuantity * line.quantity)
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            objectCustomer = updateQuantityUser.body;
        }
    }
    let order = {};
    if (isUNIZONA || isZONA || isInternational) {
        const mapToObject = (map) => {
            const obj = {};
            for (let [key, value] of map) {
                obj[key] = value;
            }
            return obj;
        };
        const plainObjectGuides = mapToObject(mapGuides);
        const createOrder = yield client_1.apiRoot.orders().post({
            body: {
                version: versionCart,
                id: cart.id,
                orderNumber: newOrder,
                custom: {
                    type: {
                        typeId: 'type',
                        key: "type-order"
                    },
                    fields: {
                        "type-order": "service",
                        "services": JSON.stringify(plainObjectGuides),
                        "ordenSap": codes[0].OrderSAP,
                        "isCombo": isUNIZONA ? true : false,
                        "invoice": "No Facturada"
                    }
                }
            }
        }).execute();
        order = createOrder.body;
    }
    else {
        const asignarGuias = yield (0, asignarGuides_1.asignGuideToOrder)(customer, cart);
        const createOrder = yield client_1.apiRoot.orders().post({
            body: {
                version: versionCart,
                id: cart.id,
                orderNumber: newOrder,
                custom: {
                    type: {
                        typeId: 'type',
                        key: "type-order"
                    },
                    fields: {
                        "services": JSON.stringify(asignarGuias),
                        "ordenSap": (_0 = (_z = codes === null || codes === void 0 ? void 0 : codes[0]) === null || _z === void 0 ? void 0 : _z.OrderSAP) !== null && _0 !== void 0 ? _0 : "",
                        "type-order": "bundle",
                        "invoice": "No Facturada"
                    }
                }
            }
        }).execute();
        order = createOrder.body;
    }
    const addPaymentToOrder = yield client_1.apiRoot.orders().withId({ ID: order.id }).post({
        body: {
            version: order.version,
            actions: [
                {
                    action: "addPayment",
                    payment: {
                        id: createPayment.body.id,
                        typeId: "payment"
                    }
                },
                {
                    action: "changePaymentState",
                    paymentState: "Paid"
                }
            ]
        }
    }).execute();
    return {
        orderId: addPaymentToOrder.body.id,
        message: "",
        isUso: false,
        isRecoleccion: false,
    };
});
exports.addPaymentToOrders = addPaymentToOrders;
