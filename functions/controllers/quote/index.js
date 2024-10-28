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
const quote_1 = require("../../estafetaAPI/quote");
const router = (0, express_1.Router)();
router.post("/quote", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let response;
    if (req.body.type == "nacional") {
        const services = yield (0, quote_1.handleCotizacion)(req.body);
        if (!req.body.IsRecoleccion) {
            for (const service of services.Quotation[0].Service) {
                service.OverweightListPrice = 0;
                service.VATApplied = 0;
                service.InsuredCost = 0;
                service.DeliveryZone = 0;
                service.FuelChargeOverweightListPrice = 0;
                service.ForwardingLevelCostListPrice = 0;
                service.TotalAmount = parseFloat((service.ListPrice + service['FuelChargeListPrice ']).toFixed(2));
            }
        }
        else {
            for (const service of services.Quotation[0].Service) {
                service.TotalAmount = parseFloat((service.TotalAmount).toFixed(2));
            }
        }
        response = services;
    }
    else if (req.body.type == "unizona") {
        const services = yield (0, quote_1.handleCotizacion)(req.body);
        if (req.body.IsRecoleccion) {
            for (const service of services.Quotation[0].Service) {
                service.ListPrice = 0;
                service['FuelChargeListPrice '] = 0;
                service.TotalAmount = parseFloat((service.OverweightListPrice + service.FuelChargeOverweightListPrice + service.ForwardingLevelCostListPrice + service.InsuredCost).toFixed(2));
            }
        }
        else {
            for (const service of services.Quotation[0].Service) {
                service.FuelChargeOverweightListPrice = 0;
                service.InsuredCost = 0;
                service.OverweightListPrice = 0;
                service.FuelChargeListPrice = 0;
                service.ListPrice = 0;
                service.VATApplied = 0;
                services.ForwardingLevelCostListPrice = 0;
                service['FuelChargeListPrice '] = 0;
                service.TotalAmount = 0;
            }
        }
        response = services;
    }
    else if (req.body.type == "internacional") {
        console.log(req.body);
        const services = yield (0, quote_1.handleCotizacionInternacional)(req.body);
        console.log("Respuesta", services);
        if (!req.body.IsRecoleccion) {
            for (const response of services.Response) {
                response.Service[0].ServiceCost.InsuredCost = 0;
                response.Service[0].ServiceCost.VATApplied = 0;
                response.Service[0].ServiceCost.ContingencyChargeListPrice = 0;
                response.Service[0].ServiceCost.SpecialHandlingListPrice = 0;
                response.Service[0].ServiceCost.OverweightListPrice = 0;
                response.Service[0].ServiceCost.FuelChargeOverweightListPrice = 0;
                response.Service[0].ServiceCost.TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + response.Service[0].ServiceCost["FuelChargeListPrice "]).toFixed(2));
            }
        }
        else {
            for (const service of services.Response) {
                service.Service[0].ServiceCost.TotalAmount = parseFloat((service.Service[0].ServiceCost.TotalAmount).toFixed(2));
            }
        }
        response = services;
    }
    else {
        return res.sendStatus(404);
    }
    return res.status(200).send(response);
}));
exports.default = router;
