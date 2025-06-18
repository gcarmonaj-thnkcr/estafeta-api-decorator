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
exports.getCustomObjectByQr = void 0;
const client_1 = require("../commercetools/client");
const getCustomObjectByQr = (qr) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customObjectsOrders = yield client_1.apiRoot.customObjects().withContainerAndKey({
            container: "orders",
            key: qr
        }).get().execute();
        if (!customObjectsOrders.statusCode || customObjectsOrders.statusCode >= 300 || !customObjectsOrders.body) {
            return {};
        }
        customObjectsOrders.body.value.order.createdAt = customObjectsOrders.body.createdAt;
        console.log(customObjectsOrders.body.value.order);
        return customObjectsOrders.body.value;
    }
    catch (error) {
        return {};
    }
});
exports.getCustomObjectByQr = getCustomObjectByQr;
