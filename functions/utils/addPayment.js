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
exports.createMapGuide = exports.addPaymentToOrders = exports.addPaymentToOrdersRecoleccion = exports.addPaymentToOrder = void 0;
const client_1 = require("../commercetools/client");
const validity_1 = require("./validity");
const pickup_1 = require("../estafetaAPI/pickup");
const purchaseOrder_1 = require("../estafetaAPI/purchaseOrder");
const folios_1 = require("../estafetaAPI/folios");
const asignarGuides_1 = require("./asignarGuides");
const logger_1 = require("./logger");
const addPaymentToOrder = (body) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const order = yield client_1.apiRoot
        .orders()
        .withId({ ID: body.transaction.order_id })
        .get()
        .execute();
    if (!order.statusCode || order.statusCode >= 300)
        return {
            message: "Error al encontrar la orden",
            response: undefined,
        };
    const customer = yield client_1.apiRoot
        .customers()
        .withId({ ID: (_a = order.body.customerId) !== null && _a !== void 0 ? _a : "" })
        .get()
        .execute();
    if (!customer.statusCode || customer.statusCode >= 300)
        return {
            message: "La orden no tiene asignado un customer",
            response: undefined,
        };
    const isRecoleccion = order.body.lineItems.some((item) => {
        var _a, _b;
        return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find((attr) => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "RECOLECCION";
    });
    let response;
    if (isRecoleccion) {
        response = yield (0, exports.addPaymentToOrdersRecoleccion)(body, order.body, customer.body);
    }
    else {
        response = yield (0, exports.addPaymentToOrders)(body, order.body, customer.body);
    }
    return {
        message: response.message,
        response,
    };
});
exports.addPaymentToOrder = addPaymentToOrder;
const addPaymentToOrdersRecoleccion = (data, order, customer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20;
    let customerCopy = customer;
    let orderVersion = order.version;
    const createPayment = yield client_1.apiRoot
        .payments()
        .post({
        body: {
            key: data.transaction.id,
            interfaceId: data.transaction.id,
            amountPlanned: {
                currencyCode: "MXN",
                centAmount: (data.transaction.amount * 100) | 0,
            },
            paymentMethodInfo: {
                paymentInterface: "OPENPAY",
                method: data.transaction.description,
                name: {
                    "es-MX": data.transaction.description,
                },
            },
            transactions: [
                {
                    interactionId: data.transaction.id,
                    type: "Charge",
                    amount: {
                        currencyCode: "MXN",
                        centAmount: (data.transaction.amount * 100) | 0,
                    },
                    state: "Success",
                },
            ],
        },
    })
        .execute();
    const pickupPackage = [];
    const mapGuide = {};
    const guides = JSON.parse((_a = order.lineItems[0].custom) === null || _a === void 0 ? void 0 : _a.fields["guia"]);
    const date = (_b = order.lineItems[0].custom) === null || _b === void 0 ? void 0 : _b.fields["adicionales"];
    const orders = yield client_1.apiRoot
        .orders()
        .get({
        queryArgs: {
            sort: `createdAt desc`,
            where: `orderNumber is defined`,
        },
    })
        .execute();
    if (!orders.body.results[0].orderNumber)
        return;
    const quantityTotalGuides = 0;
    const orderSplit = orders.body.results[0].orderNumber.split("D");
    let newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
    const createPurchaseOrder = () => __awaiter(void 0, void 0, void 0, function* () {
        const purchaseOrder = yield (0, purchaseOrder_1.WSPurchaseOrder)({
            order: order,
            code: newOrder,
            idPaymentService: data.transaction.id,
            methodName: "Openpay",
            customer,
            quantityTotalGuides,
            infoPayment: {
                typePayment: "",
                bankTypeName: "",
                transactionalCode: "",
            },
        });
        debugger;
        if (purchaseOrder.result.Code > 0) {
            if (purchaseOrder.result.Description.includes("REPEATED_TICKET")) {
                const orderSplit = newOrder.split("D");
                newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
                return yield createPurchaseOrder();
            }
            return {
                purchaseOrder: undefined,
                orderId: "",
                message: purchaseOrder.result.Description,
            };
        }
        return {
            purchaseOrder: purchaseOrder,
            orderId: "",
            message: purchaseOrder.result.Description,
        };
    });
    const purchaseResult = yield createPurchaseOrder();
    if (!purchaseResult.purchaseOrder)
        return {
            message: purchaseResult.message,
            orderId: "",
        };
    const purchaseOrder = purchaseResult.purchaseOrder;
    const codes = purchaseOrder.resultPurchaseOrder;
    for (const guide of guides) {
        // const guide = items.custom?.fields["guia"]
        // const QR = items.custom?.fields["folio_md5"]
        // date = items.custom?.fields["adicionales"]
        const orden = yield client_1.apiRoot
            .orders()
            .withId({ ID: guide.orderId })
            .get()
            .execute();
        const product = orden.body.lineItems.find((item) => item.id == guide.id);
        if (!mapGuide[order.lineItems[0].id]) {
            mapGuide[order.lineItems[0].id] = [];
        }
        mapGuide[order.lineItems[0].id].push(Object.assign({ guide: guide.guia, QR: guide.qr, isItemDimensionsExceeded: (_c = product === null || product === void 0 ? void 0 : product.custom) === null || _c === void 0 ? void 0 : _c.fields["isItemDimensionsExceeded"], isItemWeightExceeded: (_d = product === null || product === void 0 ? void 0 : product.custom) === null || _d === void 0 ? void 0 : _d.fields["isItemWeightExceeded"], isPackage: (_e = product === null || product === void 0 ? void 0 : product.custom) === null || _e === void 0 ? void 0 : _e.fields["isPackage"], isPudo: (_f = product === null || product === void 0 ? void 0 : product.custom) === null || _f === void 0 ? void 0 : _f.fields["isPudo"], itemHeight: (_g = product === null || product === void 0 ? void 0 : product.custom) === null || _g === void 0 ? void 0 : _g.fields["itemHeight"], itemLength: (_h = product === null || product === void 0 ? void 0 : product.custom) === null || _h === void 0 ? void 0 : _h.fields["itemLength"], itemVolumen: (_j = product === null || product === void 0 ? void 0 : product.custom) === null || _j === void 0 ? void 0 : _j.fields["itemVolumen"], itemWeight: (_k = product === null || product === void 0 ? void 0 : product.custom) === null || _k === void 0 ? void 0 : _k.fields["itemWeight"], itemWidth: (_l = product === null || product === void 0 ? void 0 : product.custom) === null || _l === void 0 ? void 0 : _l.fields["itemWidth"], Recoleccion: (_m = product === null || product === void 0 ? void 0 : product.custom) === null || _m === void 0 ? void 0 : _m.fields["Recoleccion"], address: guide.address, servicio: guide.typeGuide }, (0, validity_1.getValidityData)(true)));
        const servicio = JSON.parse((_o = orden.body.custom) === null || _o === void 0 ? void 0 : _o.fields["services"]);
        servicio[guide.id].guides = servicio[guide.id].guides.filter((item) => item.guide != guide.guia);
        //Actualizamos la orden
        yield client_1.apiRoot
            .orders()
            .withId({ ID: guide.orderId })
            .post({
            body: {
                version: orden.body.version,
                actions: [
                    {
                        action: "setCustomField",
                        name: "services",
                        value: JSON.stringify(servicio),
                    },
                ],
            },
        })
            .execute();
        const packagesItems = {
            PackageType: "PKG",
            Length: 46.5,
            Width: 36.5,
            Height: 40,
            Weight: 8,
            Quantity: 300,
            Description: "PAQUETES",
        };
        pickupPackage.push(packagesItems);
    }
    const newPickUpModel = {
        AccountNumber: "5909118",
        RequesterName: (_s = (_q = (_p = order.shippingAddress) === null || _p === void 0 ? void 0 : _p.firstName) !== null && _q !== void 0 ? _q : "" + ((_r = order.shippingAddress) === null || _r === void 0 ? void 0 : _r.lastName)) !== null && _s !== void 0 ? _s : "",
        RequesterEmail: (_u = (_t = order.shippingAddress) === null || _t === void 0 ? void 0 : _t.email) !== null && _u !== void 0 ? _u : "",
        PickupType: "MP",
        PickupDayPart: "PM",
        PickupDate: date,
        PickupAddress: {
            ShortName: "Domicilio",
            Country: "Mexico",
            PostalCode: (_w = (_v = order.shippingAddress) === null || _v === void 0 ? void 0 : _v.postalCode) !== null && _w !== void 0 ? _w : "",
            State: (_y = (_x = order.shippingAddress) === null || _x === void 0 ? void 0 : _x.state) !== null && _y !== void 0 ? _y : "",
            City: (_0 = (_z = order.shippingAddress) === null || _z === void 0 ? void 0 : _z.city) !== null && _0 !== void 0 ? _0 : "",
            Neighborhood: (_2 = (_1 = order.shippingAddress) === null || _1 === void 0 ? void 0 : _1.department) !== null && _2 !== void 0 ? _2 : "",
            Address1: (_4 = (_3 = order.shippingAddress) === null || _3 === void 0 ? void 0 : _3.streetName) !== null && _4 !== void 0 ? _4 : "",
            ExternalNumber: (_6 = (_5 = order.shippingAddress) === null || _5 === void 0 ? void 0 : _5.streetNumber) !== null && _6 !== void 0 ? _6 : "",
            InternalNumber: (_8 = (_7 = order.shippingAddress) === null || _7 === void 0 ? void 0 : _7.apartment) !== null && _8 !== void 0 ? _8 : "",
            BetweenStreet1: (_10 = (_9 = order.shippingAddress) === null || _9 === void 0 ? void 0 : _9.additionalStreetInfo) !== null && _10 !== void 0 ? _10 : "",
            ReferenceData: (_12 = (_11 = order.shippingAddress) === null || _11 === void 0 ? void 0 : _11.additionalAddressInfo) !== null && _12 !== void 0 ? _12 : "",
        },
        PickupAlert_Primary: {
            Name: (_16 = (_14 = (_13 = order.shippingAddress) === null || _13 === void 0 ? void 0 : _13.firstName) !== null && _14 !== void 0 ? _14 : "" + ((_15 = order.shippingAddress) === null || _15 === void 0 ? void 0 : _15.lastName)) !== null && _16 !== void 0 ? _16 : "",
            EmailAddress: (_18 = (_17 = order.shippingAddress) === null || _17 === void 0 ? void 0 : _17.email) !== null && _18 !== void 0 ? _18 : "",
            PhoneNumber: (_20 = (_19 = order.shippingAddress) === null || _19 === void 0 ? void 0 : _19.phone) !== null && _20 !== void 0 ? _20 : "",
        },
        PickupPackageList: pickupPackage,
    };
    const requestPickup = yield (0, pickup_1.newPickUp)(newPickUpModel);
    if (!requestPickup.Success) {
        return {
            orderId: "",
            message: requestPickup.ErrorList.join(","),
            isRecoleccion: false,
            isUso: false,
        };
    }
    /*
    //Descontamos guias
    let versionCustomer = customer.version
    let quantityGuideAvailablesSiguiente = customerCopy.custom?.fields["quantity-guides-dia-siguiente"]
    let quantityGuideAvailablesTerrestre = customer.custom?.fields["quantity-guides-terrestres"]
    let quantityGuideAvailablesDosDias = customer.custom?.fields["quantity-guides-dos-dias"]
    let quantityGuideAvailablesDoce = customer.custom?.fields["quantity-guides-doce-treinta"]
  
    for (const guide of guides) {
  
      if (guide.typeGuide == "DIA SIGUIENTE") {
        quantityGuideAvailablesSiguiente = quantityGuideAvailablesSiguiente - 1
        try {
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-dia-siguiente",
                  value: quantityGuideAvailablesSiguiente
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
        } catch (err: any) {
          console.log(err.message)
        }
      }
      else if (guide.typeGuide == "TERRESTRE") {
        quantityGuideAvailablesTerrestre = quantityGuideAvailablesTerrestre - 1
        try {
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-terrestres",
                  value: quantityGuideAvailablesTerrestre
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
        } catch (err: any) {
          console.log(err.message)
        }
      }
      else if (guide.typeGuide == "DOS DIAS") {
        quantityGuideAvailablesDosDias = quantityGuideAvailablesDosDias - 1
        const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
          body: {
            version: versionCustomer,
            actions: [
              {
                action: "setCustomField",
                name: "quantity-guides-dos-dias",
                value: quantityGuideAvailablesDosDias
              }
            ]
          }
        }).execute()
        versionCustomer = updateQuantityUser.body.version
      }
  
      else if (guide.typeGuide == "12:30") {
        quantityGuideAvailablesDoce = quantityGuideAvailablesDoce - 1
        const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
          body: {
            version: versionCustomer,
            actions: [
              {
                action: "setCustomField",
                name: "quantity-guides-doce-treinta",
                value: quantityGuideAvailablesDoce
              }
            ]
          }
        }).execute()
        versionCustomer = updateQuantityUser.body.version
      }
    }
    */
    const addPaymentToOrder = yield client_1.apiRoot
        .orders()
        .withId({ ID: order.id })
        .post({
        body: {
            version: order.version,
            actions: [
                {
                    action: "addPayment",
                    payment: {
                        id: createPayment.body.id,
                        typeId: "payment",
                    },
                },
                {
                    action: "changePaymentState",
                    paymentState: "Paid",
                },
                {
                    action: "setCustomField",
                    name: "ordenSap",
                    value: codes[0].OrderSAP,
                },
            ],
        },
    })
        .execute();
    return {
        orderId: addPaymentToOrder.body.id,
        message: undefined,
        isRecoleccion: false,
        isUso: false,
    };
});
exports.addPaymentToOrdersRecoleccion = addPaymentToOrdersRecoleccion;
const addPaymentToOrders = (data, order, customer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const loggerChild = logger_1.logger.child({ requestId: data.transaction.id });
    loggerChild.info(JSON.stringify(data));
    try {
        const quantityTotalGuides = 0;
        const orders = yield client_1.apiRoot
            .orders()
            .get({
            queryArgs: {
                sort: `createdAt desc`,
                where: `orderNumber is defined`,
            },
        })
            .execute();
        if (!orders.body.results[0].orderNumber)
            return;
        const orderSplit = orders.body.results[0].orderNumber.split("D");
        let newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
        loggerChild.info("Pago registrado en ct");
        const createPayment = yield client_1.apiRoot
            .payments()
            .post({
            body: {
                key: data.transaction.id,
                interfaceId: data.transaction.id,
                amountPlanned: {
                    currencyCode: "MXN",
                    centAmount: (data.transaction.amount * 100) | 0,
                },
                paymentMethodInfo: {
                    paymentInterface: "OPENPAY",
                    method: data.transaction.description,
                    name: {
                        "es-MX": data.transaction.description,
                    },
                },
                transactions: [
                    {
                        interactionId: data.transaction.id,
                        type: "Charge",
                        amount: {
                            currencyCode: "MXN",
                            centAmount: (data.transaction.amount * 100) | 0,
                        },
                        state: "Success",
                    },
                ],
            },
        })
            .execute();
        const createPurchaseOrder = () => __awaiter(void 0, void 0, void 0, function* () {
            const purchaseOrder = yield (0, purchaseOrder_1.WSPurchaseOrder)({
                order: order,
                code: newOrder,
                idPaymentService: data.transaction.id,
                methodName: "Openpay",
                customer,
                quantityTotalGuides,
                infoPayment: {
                    typePayment: data.transaction.description == "Transferencia" ? "TE" : "Cash",
                    bankTypeName: data.transaction.description == "Transferencia" ? "TE" : "Cash",
                    transactionalCode: data.transaction.description == "Transferencia"
                        ? "TRANSFE-03"
                        : "$$$$$$$-01",
                },
                logger: loggerChild,
            });
            if (purchaseOrder.result.Code > 0) {
                if (purchaseOrder.result.Description.includes("REPEATED_TICKET")) {
                    const orderSplit = newOrder.split("D");
                    newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`;
                    return yield createPurchaseOrder();
                }
                return {
                    purchaseOrder: undefined,
                    orderId: "",
                    message: purchaseOrder.result.Description,
                };
            }
            return {
                purchaseOrder: purchaseOrder,
                orderId: "",
                message: purchaseOrder.result.Description,
            };
        });
        const purchaseResult = yield createPurchaseOrder();
        if (!purchaseResult.purchaseOrder)
            return {
                message: purchaseResult.message,
                orderId: "",
            };
        const purchaseOrder = purchaseResult.purchaseOrder;
        const codes = purchaseOrder.resultPurchaseOrder;
        let mapGuides;
        if (((_b = (_a = codes === null || codes === void 0 ? void 0 : codes[0]) === null || _a === void 0 ? void 0 : _a.WaybillList) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            const folios = yield (0, folios_1.CreateFolios)((_d = (_c = codes === null || codes === void 0 ? void 0 : codes[0]) === null || _c === void 0 ? void 0 : _c.WaybillList) === null || _d === void 0 ? void 0 : _d.length, loggerChild);
            loggerChild.info(`Folios creados`);
            mapGuides = (0, exports.createMapGuide)(codes, order, folios.data.folioResult);
        }
        const userUpdated = yield client_1.apiRoot
            .customers()
            .get({
            queryArgs: {
                where: `email in ("${customer.email}")`,
            },
        })
            .execute();
        let versionCustomer = userUpdated.body.results[0].version;
        let objectCustomer = userUpdated.body.results[0];
        //Esto es para agregar items
        for (const line of order.lineItems) {
            const attrType = (_f = (_e = line.variant.attributes) === null || _e === void 0 ? void 0 : _e.find((item) => item.name == "tipo-paquete")) === null || _f === void 0 ? void 0 : _f.value["label"];
            if (attrType != "UNIZONA")
                continue;
            const attrQuantity = (_j = (_h = (_g = line.variant.attributes) === null || _g === void 0 ? void 0 : _g.find((item) => item.name == "quantity-items")) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 1;
            const attrService = (_l = (_k = line.variant.attributes) === null || _k === void 0 ? void 0 : _k.find((item) => item.name == "servicio")) === null || _l === void 0 ? void 0 : _l.value["label"];
            debugger;
            if (attrService == "DIA SIGUIENTE") {
                const quantityGuideAvailables = (_p = (_o = (_m = objectCustomer.custom) === null || _m === void 0 ? void 0 : _m.fields) === null || _o === void 0 ? void 0 : _o["quantity-guides-dia-siguiente"]) !== null && _p !== void 0 ? _p : 0;
                const updateQuantityUser = yield client_1.apiRoot
                    .customers()
                    .withId({ ID: customer.id })
                    .post({
                    body: {
                        version: versionCustomer,
                        actions: [
                            {
                                action: "setCustomField",
                                name: "quantity-guides-dia-siguiente",
                                value: quantityGuideAvailables + attrQuantity * line.quantity,
                            },
                        ],
                    },
                })
                    .execute();
                versionCustomer = updateQuantityUser.body.version;
                objectCustomer = updateQuantityUser.body;
            }
            else if (attrService == "TERRESTRE") {
                const quantityGuideAvailables = (_s = (_r = (_q = objectCustomer.custom) === null || _q === void 0 ? void 0 : _q.fields) === null || _r === void 0 ? void 0 : _r["quantity-guides-terrestres"]) !== null && _s !== void 0 ? _s : 0;
                const updateQuantityUser = yield client_1.apiRoot
                    .customers()
                    .withId({ ID: customer.id })
                    .post({
                    body: {
                        version: versionCustomer,
                        actions: [
                            {
                                action: "setCustomField",
                                name: "quantity-guides-terrestres",
                                value: quantityGuideAvailables + attrQuantity * line.quantity,
                            },
                        ],
                    },
                })
                    .execute();
                versionCustomer = updateQuantityUser.body.version;
                objectCustomer = updateQuantityUser.body;
            }
            else if (attrService == "DOS DIAS") {
                const quantityGuideAvailables = (_v = (_u = (_t = objectCustomer.custom) === null || _t === void 0 ? void 0 : _t.fields) === null || _u === void 0 ? void 0 : _u["quantity-guides-dos-dias"]) !== null && _v !== void 0 ? _v : 0;
                const updateQuantityUser = yield client_1.apiRoot
                    .customers()
                    .withId({ ID: customer.id })
                    .post({
                    body: {
                        version: versionCustomer,
                        actions: [
                            {
                                action: "setCustomField",
                                name: "quantity-guides-dos-dias",
                                value: quantityGuideAvailables + attrQuantity * line.quantity,
                            },
                        ],
                    },
                })
                    .execute();
                versionCustomer = updateQuantityUser.body.version;
                objectCustomer = updateQuantityUser.body;
            }
            else if (attrService == "12:30") {
                const quantityGuideAvailables = (_y = (_x = (_w = objectCustomer.custom) === null || _w === void 0 ? void 0 : _w.fields) === null || _x === void 0 ? void 0 : _x["quantity-guides-doce-treinta"]) !== null && _y !== void 0 ? _y : 0;
                const updateQuantityUser = yield client_1.apiRoot
                    .customers()
                    .withId({ ID: customer.id })
                    .post({
                    body: {
                        version: versionCustomer,
                        actions: [
                            {
                                action: "setCustomField",
                                name: "quantity-guides-doce-treinta",
                                value: quantityGuideAvailables + attrQuantity * line.quantity,
                            },
                        ],
                    },
                })
                    .execute();
                versionCustomer = updateQuantityUser.body.version;
                objectCustomer = updateQuantityUser.body;
            }
        }
        const isZONA = order.lineItems.some((item) => {
            var _a, _b;
            return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find((attr) => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA";
        });
        const isUNIZONA = order.lineItems.some((item) => {
            var _a, _b;
            return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find((attr) => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "UNIZONA";
        });
        const isInternational = order.lineItems.some((item) => {
            var _a, _b;
            return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find((attr) => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA INTERNACIONAL";
        });
        if (isUNIZONA || isZONA || isInternational) {
            const mapToObject = (map) => {
                const obj = {};
                for (let [key, value] of map) {
                    obj[key] = value;
                }
                return obj;
            };
            const plainObjectGuides = mapToObject(mapGuides);
            const addPaymentToOrder = yield client_1.apiRoot
                .orders()
                .withId({ ID: order.id })
                .post({
                body: {
                    version: order.version,
                    actions: [
                        {
                            action: "addPayment",
                            payment: {
                                id: createPayment.body.id,
                                typeId: "payment",
                            },
                        },
                        {
                            action: "changePaymentState",
                            paymentState: "Paid",
                        },
                        {
                            action: "setCustomField",
                            name: "services",
                            value: JSON.stringify(plainObjectGuides),
                        },
                        {
                            action: "setCustomField",
                            name: "ordenSap",
                            value: codes[0].OrderSAP,
                        },
                        {
                            action: "setCustomField",
                            name: "invoice",
                            value: "No Facturada",
                        },
                        {
                            action: "setOrderNumber",
                            orderNumber: newOrder,
                        },
                        {
                            action: "setCustomField",
                            name: "isCombo",
                            value: isUNIZONA ? true : false,
                        },
                    ],
                },
            })
                .execute();
            return {
                orderId: addPaymentToOrder.body.id,
                message: "",
                isUso: false,
                isRecoleccion: false,
            };
        }
        else {
            const asignarGuias = yield (0, asignarGuides_1.asignGuideToOrder)(customer, order);
            const addPaymentToOrder = yield client_1.apiRoot
                .orders()
                .withId({ ID: order.id })
                .post({
                body: {
                    version: order.version,
                    actions: [
                        {
                            action: "addPayment",
                            payment: {
                                id: createPayment.body.id,
                                typeId: "payment",
                            },
                        },
                        {
                            action: "changePaymentState",
                            paymentState: "Paid",
                        },
                        {
                            action: "setCustomField",
                            name: "services",
                            value: JSON.stringify(asignarGuias),
                        },
                        {
                            action: "setCustomField",
                            name: "ordenSap",
                            value: codes[0].OrderSAP,
                        },
                        {
                            action: "setCustomField",
                            name: "invoice",
                            value: "No Facturada",
                        },
                        {
                            action: "setOrderNumber",
                            orderNumber: newOrder,
                        },
                    ],
                },
            })
                .execute();
            loggerChild.info(`Orden creada: ${(_0 = (_z = addPaymentToOrder === null || addPaymentToOrder === void 0 ? void 0 : addPaymentToOrder.body) === null || _z === void 0 ? void 0 : _z.orderNumber) !== null && _0 !== void 0 ? _0 : ""}`);
            return {
                orderId: addPaymentToOrder.body.id,
                message: "",
                isUso: false,
                isRecoleccion: false,
            };
        }
    }
    catch (err) {
        loggerChild.error(err);
    }
});
exports.addPaymentToOrders = addPaymentToOrders;
const createMapGuide = (guides, order, folios) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const lineGuides = new Map();
    const typeService = new Map();
    if (!order.lineItems || ((_a = order.lineItems) === null || _a === void 0 ? void 0 : _a.length) <= 0)
        return lineGuides;
    // Primer bucle para inicializar lineGuides y typeService
    for (const line of order.lineItems) {
        if (line.price.value.centAmount <= 0)
            continue;
        const type = (_d = (_c = (_b = line === null || line === void 0 ? void 0 : line.variant) === null || _b === void 0 ? void 0 : _b.attributes) === null || _c === void 0 ? void 0 : _c.find((attr) => attr.name == "tipo-paquete")) === null || _d === void 0 ? void 0 : _d.value["label"];
        const services = (_g = (_f = (_e = line === null || line === void 0 ? void 0 : line.variant) === null || _e === void 0 ? void 0 : _e.attributes) === null || _f === void 0 ? void 0 : _f.find((attr) => attr.name == "servicio")) === null || _g === void 0 ? void 0 : _g.value["label"];
        if (!type)
            continue;
        // Crear objeto ILineGuide y asignar guides como array vacío
        const guidesItems = {
            sku: (_j = (_h = line === null || line === void 0 ? void 0 : line.variant) === null || _h === void 0 ? void 0 : _h.sku) !== null && _j !== void 0 ? _j : "",
            code: guides[0].Code,
            orderSap: guides[0].OrderSAP,
            guides: [], // Inicializar guides como un array vacío
        };
        lineGuides.set(line.id, guidesItems);
        typeService.set(services, line.id);
    }
    // Segundo bucle para asignar guías basadas en el tipo de servicio
    for (const guia of guides[0].WaybillList) {
        const index = guia.Code.charAt(13);
        let id;
        if (index == "6") {
            id = typeService.get("DIA SIGUIENTE");
        }
        else if (index == "D") {
            id = typeService.get("DOS DIAS");
        }
        else if (index == "7") {
            id = typeService.get("TERRESTRE");
        }
        else if (index == "H") {
            id = typeService.get("12:30");
        }
        else if (index == "G") {
            id = typeService.get("USA ECONOMICO PREPAGADO");
        }
        else {
            id = typeService.get("SERVICIO GLOBAL EXPRESS PREPAGADO");
        }
        if (id) {
            const lineGuide = lineGuides.get(id);
            if (!lineGuide)
                continue;
            const origenDestino = order.lineItems.find((item) => item.id == id);
            // Asegurarse de que guides esté inicializado antes de hacer push
            (_k = lineGuide.guides) === null || _k === void 0 ? void 0 : _k.push(Object.assign({ guide: guia.Code, trackingCode: guia.TrackingCode, QR: ((_l = folios === null || folios === void 0 ? void 0 : folios[0]) === null || _l === void 0 ? void 0 : _l.folioMD5) ? `Q3SQR${folios[0].folioMD5}` : "0", isItemDimensionsExceeded: (_m = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _m === void 0 ? void 0 : _m.fields["isItemDimensionsExceeded"], isItemWeightExceeded: (_o = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _o === void 0 ? void 0 : _o.fields["isItemWeightExceeded"], isPackage: (_p = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _p === void 0 ? void 0 : _p.fields["isPackage"], isPudo: (_q = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _q === void 0 ? void 0 : _q.fields["isPudo"], itemHeight: (_r = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _r === void 0 ? void 0 : _r.fields["itemHeight"], itemLength: (_s = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _s === void 0 ? void 0 : _s.fields["itemLength"], itemVolumen: (_t = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _t === void 0 ? void 0 : _t.fields["itemVolumen"], itemWeight: (_u = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _u === void 0 ? void 0 : _u.fields["itemWeight"], itemWidth: (_v = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _v === void 0 ? void 0 : _v.fields["itemWidth"], Recoleccion: (_w = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _w === void 0 ? void 0 : _w.fields["Recoleccion"], address: JSON.parse((_z = (_y = (_x = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _x === void 0 ? void 0 : _x.fields) === null || _y === void 0 ? void 0 : _y["origen-destino"]) !== null && _z !== void 0 ? _z : "{}") }, (0, validity_1.getValidityData)(false, (_0 = origenDestino === null || origenDestino === void 0 ? void 0 : origenDestino.custom) === null || _0 === void 0 ? void 0 : _0.fields["isPudo"])));
        }
        if ((folios === null || folios === void 0 ? void 0 : folios.length) > 0) {
            folios.shift();
        }
    }
    return lineGuides;
};
exports.createMapGuide = createMapGuide;
