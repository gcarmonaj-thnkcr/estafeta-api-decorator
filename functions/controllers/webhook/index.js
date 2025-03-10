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
const addPayment_1 = require("../../utils/addPayment");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
router.post("/payment/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentInfo = req.body;
        if (paymentInfo.transaction.status != "completed")
            return res.sendStatus(200);
        if (paymentInfo.transaction.method == "card")
            return res.sendStatus(200);
        const responsePayment = yield (0, addPayment_1.addPaymentToOrder)(paymentInfo);
        if (responsePayment.message) {
            logger_1.logger.error(responsePayment);
            return res.sendStatus(500);
        }
        return res.sendStatus(200);
    }
    catch (err) {
        return res.status(500).send({ message: err.message });
    }
}));
router.post("/waybills/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Post to recive a PUSH notification from estafeta API process
    console.log(req.body);
    const pushTrackingRequest = req.body;
    // ToDo: Implement the logic to update the waybill status
    return res.sendStatus(200);
}));
exports.default = router;
