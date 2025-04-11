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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33;
    let response;
    if (req.body.type == "nacional") {
        const services = yield (0, quote_1.handleCotizacion)(req.body);
        if (!req.body.IsRecoleccion) {
            for (const service of services.Quotation[0].Service) {
                service.OverweightListPrice = 0;
                service.VATApplied = 0;
                service.InsuredCost = 16;
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
        const services = yield (0, quote_1.handleCotizacionInternacional)(req.body);
        if (!req.body.IsRecoleccion) {
            for (const response of services.Response) {
                response.Service[0].ServiceCost.InsuredCost = 0;
                const vatApplied = ((_g = (_f = (_e = response.Service) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.ServiceCost) === null || _g === void 0 ? void 0 : _g.VATApplied) ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 1;
                //const vatApplied = 1 
                response.Service[0].ServiceCost.ContingencyChargeListPrice = ((_k = (_j = (_h = response.Service) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.ServiceCost) === null || _k === void 0 ? void 0 : _k.ContingencyChargeListPrice) ? ((_o = (_m = (_l = response.Service) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.ServiceCost) === null || _o === void 0 ? void 0 : _o.ContingencyChargeListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost.OverweightListPrice = 0;
                response.Service[0].ServiceCost.FuelChargeOverweightListPrice = 0;
                response.Service[0].ServiceCost.ListPrice = ((_r = (_q = (_p = response.Service) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.ServiceCost) === null || _r === void 0 ? void 0 : _r.ListPrice) ? ((_u = (_t = (_s = response.Service) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.ServiceCost) === null || _u === void 0 ? void 0 : _u.ListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost["FuelChargeListPrice "] = ((_x = (_w = (_v = response.Service) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.ServiceCost) === null || _x === void 0 ? void 0 : _x["FuelChargeListPrice "]) ? ((_0 = (_z = (_y = response.Service) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.ServiceCost) === null || _0 === void 0 ? void 0 : _0["FuelChargeListPrice "]) * vatApplied : 0;
                response.Service[0].ServiceCost.TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + ((_3 = (_2 = (_1 = response.Service) === null || _1 === void 0 ? void 0 : _1[0]) === null || _2 === void 0 ? void 0 : _2.ServiceCost) === null || _3 === void 0 ? void 0 : _3.ContingencyChargeListPrice) + response.Service[0].ServiceCost["FuelChargeListPrice "]).toFixed(2));
            }
        }
        else {
            for (const response of services.Response) {
                const vatApplied = ((_6 = (_5 = (_4 = response.Service) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.ServiceCost) === null || _6 === void 0 ? void 0 : _6.VATApplied) ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 1;
                //const vatApplied = 1
                let totalAmount = response.Service[0].ServiceCost.TotalAmount - ((_10 = (_9 = (_8 = (_7 = response.Service) === null || _7 === void 0 ? void 0 : _7[0]) === null || _8 === void 0 ? void 0 : _8.ServiceCost) === null || _9 === void 0 ? void 0 : _9.ContingencyChargeListPrice) !== null && _10 !== void 0 ? _10 : 0) - ((_14 = (_13 = (_12 = (_11 = response.Service) === null || _11 === void 0 ? void 0 : _11[0]) === null || _12 === void 0 ? void 0 : _12.ServiceCost) === null || _13 === void 0 ? void 0 : _13.ListPrice) !== null && _14 !== void 0 ? _14 : 0) - ((_15 = response.Service[0].ServiceCost["FuelChargeListPrice "]) !== null && _15 !== void 0 ? _15 : 0);
                response.Service[0].ServiceCost.ContingencyChargeListPrice = ((_18 = (_17 = (_16 = response.Service) === null || _16 === void 0 ? void 0 : _16[0]) === null || _17 === void 0 ? void 0 : _17.ServiceCost) === null || _18 === void 0 ? void 0 : _18.ContingencyChargeListPrice) ? ((_21 = (_20 = (_19 = response.Service) === null || _19 === void 0 ? void 0 : _19[0]) === null || _20 === void 0 ? void 0 : _20.ServiceCost) === null || _21 === void 0 ? void 0 : _21.ContingencyChargeListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost.ListPrice = ((_24 = (_23 = (_22 = response.Service) === null || _22 === void 0 ? void 0 : _22[0]) === null || _23 === void 0 ? void 0 : _23.ServiceCost) === null || _24 === void 0 ? void 0 : _24.ListPrice) ? ((_27 = (_26 = (_25 = response.Service) === null || _25 === void 0 ? void 0 : _25[0]) === null || _26 === void 0 ? void 0 : _26.ServiceCost) === null || _27 === void 0 ? void 0 : _27.ListPrice) * vatApplied : 0;
                response.Service[0].ServiceCost["FuelChargeListPrice "] = ((_30 = (_29 = (_28 = response.Service) === null || _28 === void 0 ? void 0 : _28[0]) === null || _29 === void 0 ? void 0 : _29.ServiceCost) === null || _30 === void 0 ? void 0 : _30["FuelChargeListPrice "]) ? ((_33 = (_32 = (_31 = response.Service) === null || _31 === void 0 ? void 0 : _31[0]) === null || _32 === void 0 ? void 0 : _32.ServiceCost) === null || _33 === void 0 ? void 0 : _33["FuelChargeListPrice "]) * vatApplied : 0;
                totalAmount = totalAmount + response.Service[0].ServiceCost.ContingencyChargeListPrice + response.Service[0].ServiceCost.ListPrice + response.Service[0].ServiceCost["FuelChargeListPrice "];
                response.Service[0].ServiceCost.TotalAmount = parseFloat((totalAmount).toFixed(2));
            }
        }
        response = services;
    }
    else {
        console.log("");
        return res.sendStatus(404);
    }
    return res.status(200).send(response);
}));
exports.default = router;
