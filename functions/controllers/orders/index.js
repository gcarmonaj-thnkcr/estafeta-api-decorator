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
const client_1 = require("../../commercetools/client");
const router = (0, express_1.Router)();
router.get("/ordersExpired/:idCustomer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let countGuides = 0;
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
    for (const order of orders.body.results) {
        const services = (_a = order.custom) === null || _a === void 0 ? void 0 : _a.fields["services"];
        if (!services)
            continue;
        for (const key in services) {
            countGuides = countGuides + services[key].guides.length;
        }
    }
    return res.status(200).send({
        message: '',
        ordersToExpired: countGuides
    });
}));
router.post("/payment/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    return res.sendStatus(200);
}));
exports.default = router;
