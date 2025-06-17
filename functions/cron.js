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
exports.handler = void 0;
const client_1 = require("./commercetools/client");
const handler = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log("Ejecutando cron job");
    const customOStatus = yield client_1.apiRoot
        .customObjects()
        .withContainer({ container: "orderStatus" })
        .get()
        .execute();
    if (!customOStatus.statusCode || customOStatus.statusCode >= 300)
        return { statusCode: 500, body: "No hay órdenes a actualizar" };
    if (customOStatus.body.results.length <= 0)
        return { statusCode: 200, body: "Sin órdenes pendientes" };
    console.log("Órdenes a ejecutar encontradas:", customOStatus.body.results.length);
    for (const statusOrders of customOStatus.body.results) {
        const dateOrder = new Date(statusOrders.lastModifiedAt);
        const dateNow = new Date();
        const diffInMinutes = (dateNow.getTime() - dateOrder.getTime()) / (1000 * 60);
        if (diffInMinutes < 15) {
            console.log("Esta orden aún no tiene los 15 minutos");
            continue;
        }
        const services = JSON.parse(statusOrders.value.order.custom.fields["services"]);
        for (const item of statusOrders.value.order.lineItems) {
            for (const guide of services[item.id].guides) {
                if (guide.status === "EN PROCESO")
                    guide.status = "DISPONIBLE";
            }
        }
        if (statusOrders.value.isOrdenCustom === "No") {
            const orden = yield client_1.apiRoot
                .orders()
                .withId({ ID: statusOrders.value.order.id })
                .get()
                .execute();
            yield client_1.apiRoot
                .orders()
                .withId({ ID: orden.body.id })
                .post({
                body: {
                    version: orden.body.version,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "services",
                            value: JSON.stringify(services),
                        },
                    ],
                },
            })
                .execute();
        }
        else {
            const orders = yield client_1.apiRoot
                .customObjects()
                .withContainer({ container: "orders" })
                .get({
                queryArgs: {
                    where: `value (order (id in ("${statusOrders.value.order.id}")))`,
                },
            })
                .execute();
            for (const order of orders.body.results) {
                const ordenN = Object.assign(Object.assign({}, order.value.order), { custom: {
                        type: {
                            id: (_c = (_b = (_a = order.value.order.custom) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "",
                            typeId: (_f = (_e = (_d = order.value.order.custom) === null || _d === void 0 ? void 0 : _d.type) === null || _e === void 0 ? void 0 : _e.typeId) !== null && _f !== void 0 ? _f : "type",
                        },
                        fields: Object.assign(Object.assign({}, (_g = order.value.order.custom) === null || _g === void 0 ? void 0 : _g.fields), { services: JSON.stringify(services) }),
                    } });
                yield client_1.apiRoot
                    .customObjects()
                    .post({
                    body: {
                        container: "orders",
                        key: order.key,
                        value: {
                            order: ordenN,
                            qr: order.key,
                            user: order.value.user,
                            idOrden: order.value.idOrden,
                            isOrdenCustom: order.value.isOrdenCustom,
                        },
                    },
                })
                    .execute();
            }
        }
        yield client_1.apiRoot
            .customObjects()
            .withContainerAndKey({
            container: "orderStatus",
            key: statusOrders.key,
        })
            .delete({
            queryArgs: {
                version: statusOrders.version,
            },
        })
            .execute();
        console.log("Orden procesada y eliminada");
    }
    return { statusCode: 200, body: "Proceso finalizado" };
});
exports.handler = handler;
