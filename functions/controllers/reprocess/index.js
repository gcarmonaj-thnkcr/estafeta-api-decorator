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
const reprocessPayment_1 = require("../../utils/reprocessPayment");
const router = (0, express_1.Router)();
router.post("/reprocess", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, transactionId } = req.body;
    const reprocess = yield (0, reprocessPayment_1.reprocessPayment)(id, transactionId);
    return res.status(reprocess.status).send({
        body: reprocess.response
    });
}));
exports.default = router;
