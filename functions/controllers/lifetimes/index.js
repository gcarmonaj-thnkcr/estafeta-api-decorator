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
const orderstoNotify = [];
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
        console.log("Formated date: ", fechaFormateada);
        orderstoNotify.push({
            emailClient: customer.body.email,
            clientName: ((_c = (_b = customer.body) === null || _b === void 0 ? void 0 : _b.firstName) !== null && _c !== void 0 ? _c : "") + ((_e = (_d = customer.body) === null || _d === void 0 ? void 0 : _d.lastName) !== null && _e !== void 0 ? _e : "") + ((_g = (_f = customer.body) === null || _f === void 0 ? void 0 : _f.middleName) !== null && _g !== void 0 ? _g : ""),
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
    var _a;
    console.log("Lifetimes called");
    let orders = [];
    const endDate = req.headers.date;
    const orders_bundle = yield client_1.apiRoot.orders().get({
        queryArgs: {
            limit: 500,
            sort: "createdAt desc",
            where: 'custom(fields(type-order="service")) and createdAt >= "2022-10-26T00:00:00Z"',
        }
    }).execute();
    orders = orders_bundle.body.results;
    if (orders_bundle.body.results.length <= 0)
        return res.sendStatus(204);
    console.log("Orders length: ", orders_bundle.body.results.length);
    const order_count = ((_a = orders_bundle.body.total) !== null && _a !== void 0 ? _a : 0) - 500;
    console.log("Order count: ", order_count);
    for (let i = 501; i < order_count; i += 500) {
        console.log("Offset: ", i);
        const orders_bundle = yield client_1.apiRoot.orders().get({
            queryArgs: {
                limit: 500,
                offset: i,
                sort: "createdAt desc",
                where: 'custom(fields(type-order="service"))',
            }
        }).execute();
        if (orders_bundle.body.results.length <= 0)
            return res.sendStatus(204);
        orders = [...orders, ...orders_bundle.body.results];
    }
    console.log("Orders: ", orders.length);
    //@ts-ignore
    const ordersCombo = orders.filter(order => order.lineItems.some(item => { var _a; return (_a = item.variant) === null || _a === void 0 ? void 0 : _a.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA"); }));
    console.log("Combo Orders: ", ordersCombo.length);
    for (const order of ordersCombo) {
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
exports.default = router;
