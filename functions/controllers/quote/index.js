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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
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
                service.OverweightListPrice = (_a = service === null || service === void 0 ? void 0 : service.OverweightListPrice) !== null && _a !== void 0 ? _a : 0;
                service.FuelChargeOverweightListPrice = (_b = service === null || service === void 0 ? void 0 : service.FuelChargeOverweightListPrice) !== null && _b !== void 0 ? _b : 0;
                service.ForwardingLevelCostListPrice = (_c = service === null || service === void 0 ? void 0 : service.ForwardingLevelCostListPrice) !== null && _c !== void 0 ? _c : 0;
                service.InsuredCost = (_d = service === null || service === void 0 ? void 0 : service.InsuredCost) !== null && _d !== void 0 ? _d : 0;
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
                const vatApplied = ((_g = (_f = (_e = response.Service) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.ServiceCost) === null || _g === void 0 ? void 0 : _g.VATApplied) ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 0;
                response.Service[0].ServiceCost.ContingencyChargeListPrice = ((_k = (_j = (_h = response.Service) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.ServiceCost) === null || _k === void 0 ? void 0 : _k.ContingencyChargeListPrice) ? ((_o = (_m = (_l = response.Service) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.ServiceCost) === null || _o === void 0 ? void 0 : _o.ContingencyChargeListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost.OverweightListPrice = 0;
                response.Service[0].ServiceCost.FuelChargeOverweightListPrice = 0;
                response.Service[0].ServiceCost.ListPrice = ((_r = (_q = (_p = response.Service) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.ServiceCost) === null || _r === void 0 ? void 0 : _r.ListPrice) ? ((_u = (_t = (_s = response.Service) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.ServiceCost) === null || _u === void 0 ? void 0 : _u.ListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost["FuelChargeListPrice "] = ((_x = (_w = (_v = response.Service) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.ServiceCost) === null || _x === void 0 ? void 0 : _x["FuelChargeListPrice "]) ? ((_0 = (_z = (_y = response.Service) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.ServiceCost) === null || _0 === void 0 ? void 0 : _0["FuelChargeListPrice "]) * vatApplied : 0;
                response.Service[0].ServiceCost.TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + ((_3 = (_2 = (_1 = response.Service) === null || _1 === void 0 ? void 0 : _1[0]) === null || _2 === void 0 ? void 0 : _2.ServiceCost) === null || _3 === void 0 ? void 0 : _3.ContingencyChargeListPrice) + response.Service[0].ServiceCost["FuelChargeListPrice "]).toFixed(2));
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
