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
const validate_1 = require("../../validateDate/validate");
const router = (0, express_1.Router)();
let orderstoNotify = [];
const addObject = (index, order, days, daysDif) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const customer = yield client_1.apiRoot.customers().withId({ ID: (_a = order.customerId) !== null && _a !== void 0 ? _a : "" }).get().execute();
        if (!customer.statusCode || customer.statusCode >= 300)
            return;
        const products = [];
        for (const item of order.lineItems) {
            products.push(`(${item.quantity})${(_b = item.name["es-MX"]) !== null && _b !== void 0 ? _b : item.name["en"]} ${(_d = (_c = item.variant.attributes) === null || _c === void 0 ? void 0 : _c.find(item => item.name == "servicio")) === null || _d === void 0 ? void 0 : _d.value["key"].replace('-', " ")}`);
        }
        const date = new Date(order.createdAt);
        date.setDate(date.getDate() + 454);
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        // Formatear la fecha 
        // @ts-ignore
        const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
        orderstoNotify.push({
            emailClient: customer.body.email,
            clientName: ((_f = (_e = customer.body) === null || _e === void 0 ? void 0 : _e.firstName) !== null && _f !== void 0 ? _f : "") + ((_h = (_g = customer.body) === null || _g === void 0 ? void 0 : _g.lastName) !== null && _h !== void 0 ? _h : "") + ((_k = (_j = customer.body) === null || _j === void 0 ? void 0 : _j.middleName) !== null && _k !== void 0 ? _k : ""),
            folios: products.join(","),
            expirationDate: fechaFormateada,
            expirationDays: days
        });
    }
    catch (err) {
        console.log(err.message);
        return;
    }
});
router.get("/lifetimes", token_1.validateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let orders = [];
    const endDate = req.headers.date;
    const limit = parseInt(req.headers.limit) || 20;
    const offset = parseInt(req.headers.offset) || 0;
    const orders_bundle = yield client_1.apiRoot.orders().get({
        queryArgs: {
            limit: limit,
            offset: offset,
            sort: "createdAt desc",
            where: 'custom(fields(isCombo=true)) and createdAt >= "2023-10-26T00:00:00Z"',
        }
    }).execute();
    orders = orders_bundle.body.results;
    if (orders_bundle.body.results.length <= 0)
        return res.sendStatus(204);
    const order_count = ((_a = orders_bundle.body.total) !== null && _a !== void 0 ? _a : 0) - 500;
    /*
    for (let i = 501; i < order_count; i += 500) {
      console.log("Offset: ", i)
      const orders_bundle = await apiRoot.orders().get({
        queryArgs: {
          limit: 500,
          offset: i,
          sort: "createdAt desc",
          where: 'custom(fields(type-order="service"))',
        }
      }).execute()
      if (orders_bundle.body.results.length <= 0) return res.sendStatus(204)
      orders = [...orders, ...orders_bundle.body.results]
    }
    */
    console.log("Orders: ", orders.length);
    //@ts-ignore
    //const ordersCombo = orders.filter(order => order.lineItems.some(item => item.variant?.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA")))
    orderstoNotify = [];
    for (const order of orders) {
        console.log('-----------------');
        console.log(order.customerEmail);
        console.log((_b = order.orderNumber) !== null && _b !== void 0 ? _b : "");
        const daysDif = (0, validate_1.checkDate)(order.createdAt, endDate);
        console.log("Days diference: ", daysDif);
        switch (daysDif) {
            case 365:
                yield client_1.apiRoot.orders().withId({ ID: order.id }).post({
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
                yield addObject(daysDif, order, 90, daysDif);
                break;
            case 425:
                yield addObject(daysDif, order, 30, daysDif);
                break;
            // case 442:
            case 440:
                yield addObject(daysDif, order, 15, daysDif);
                break;
            case 448:
                yield addObject(daysDif, order, 7, daysDif);
                break;
            case 452:
                yield addObject(daysDif, order, 1, daysDif);
                break;
        }
    }
    return res.status(200).send({
        limit: limit,
        offset: offset,
        count: orders_bundle.body.count,
        total: orders_bundle.body.total,
        statusCode: 200,
        body: orderstoNotify,
    });
}));
exports.default = router;
