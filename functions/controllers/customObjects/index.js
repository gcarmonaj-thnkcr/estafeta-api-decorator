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
router.post("/order", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { order, qr, user, idOrden } = request.body;
    if (!order || !qr || !user) {
        return reply.status(400).send({ error: "Faltan datos requeridos" });
    }
    const customObjectOrder = yield client_1.apiRoot
        .customObjects()
        .post({
        body: {
            container: "orders",
            key: qr,
            value: {
                order,
                qr,
                user,
                idOrden,
            },
        },
    })
        .execute();
    reply.status(201).send({ id: customObjectOrder.body.id });
}));
router.put("/order", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { order, qr, user, idOrden } = request.body;
    if (!order || !qr || !user || !idOrden) {
        return reply.status(400).send({ error: "Faltan datos requeridos" });
    }
    const customObjectOrder = yield client_1.apiRoot
        .customObjects()
        .post({
        body: {
            container: "orders",
            key: qr,
            value: {
                order,
                qr,
                user,
                idOrden,
            },
        },
    })
        .execute();
    reply.status(200).send({ id: customObjectOrder.body.id });
    return;
}));
router.get("/order/:id", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(request.params.id);
        const order = yield client_1.apiRoot
            .customObjects()
            .get({
            queryArgs: {
                where: `value (order ( id in ("${request.params.id}")))`,
            },
        })
            .execute();
        if (!order.statusCode ||
            order.statusCode >= 300 ||
            order.body.results.length <= 0) {
            return reply.status(404).send({ error: "Orden no encontrada" });
        }
        order.body.results[0].value.order.createdAt =
            order.body.results[0].createdAt;
        reply.send(order.body.results[0].value);
    }
    catch (error) {
        reply.status(400).send({ error: error.message });
    }
}));
router.get("/orders/:id", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(request.params.id);
        const customObjectsOrders = yield client_1.apiRoot
            .customObjects()
            .get({
            queryArgs: {
                where: `value (idOrden in ("${request.params.id}"))`,
            },
        })
            .execute();
        if (!customObjectsOrders.statusCode ||
            customObjectsOrders.statusCode >= 300 ||
            customObjectsOrders.body.results.length <= 0) {
            return reply.status(404).send({ error: "Orden no encontrada" });
        }
        const orders = [];
        for (const order of customObjectsOrders.body.results) {
            order.value.order.createdAt = order.createdAt;
            orders.push(order.value);
        }
        reply.send(orders);
    }
    catch (error) {
        reply.status(400).send({ error: error.message });
    }
}));
router.get("/order/qr/:qr", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customObjectsOrders = yield client_1.apiRoot
            .customObjects()
            .withContainerAndKey({
            container: "orders",
            key: request.params.qr,
        })
            .get()
            .execute();
        if (!customObjectsOrders.statusCode ||
            customObjectsOrders.statusCode >= 300 ||
            !customObjectsOrders.body) {
            return reply.status(404).send({ error: "Orden no encontrada" });
        }
        customObjectsOrders.body.value.order.createdAt =
            customObjectsOrders.body.createdAt;
        console.log(customObjectsOrders.body.value.order);
        reply.send(customObjectsOrders.body.value);
    }
    catch (error) {
        reply.status(400).send({ error: error.message });
    }
}));
router.get("/order/user/:id", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    let customObjectsOrders = [];
    let done = false;
    let total = 10000;
    let offset = 0;
    console.log("Entre aqui");
    try {
        do {
            const customObjectsGet = yield client_1.apiRoot
                .customObjects()
                .get({
                queryArgs: {
                    limit: 500,
                    where: `value (user in ("${request.params.id}"))`,
                    offset,
                },
            })
                .execute();
            const { results } = customObjectsGet.body;
            customObjectsOrders.push(...results);
            offset += 500;
            console.log(offset);
            if (offset >= total)
                done = true;
        } while (!done);
        const orders = [];
        for (const order of customObjectsOrders) {
            order.value.order.createdAt = order.createdAt;
            orders.push(order.value);
        }
        const orderItems = Object.values(orders.reduce((acc, item) => {
            if (!acc[item.idOrden])
                acc[item.idOrden] = item;
            return acc;
        }, {}));
        reply.send(orderItems);
    }
    catch (error) {
        reply.status(400).send({ error: error.message });
    }
}));
exports.default = router;
