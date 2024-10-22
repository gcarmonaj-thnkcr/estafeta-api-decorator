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
const router = (0, express_1.Router)();
router.post("/payment/webhook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("llegue");
        const paymentInfo = req.body;
        console.log(paymentInfo.transaction);
        if (paymentInfo.transaction.status != "completed")
            return res.sendStatus(400);
        const responsePayment = yield (0, addPayment_1.addPaymentToOrder)(paymentInfo);
        if (responsePayment.message) {
            console.log(responsePayment);
            return res.sendStatus(500);
        }
        return res.sendStatus(200);
    }
    catch (err) {
        return res.status(500).send({ message: err.message });
    }
}));
exports.default = router;