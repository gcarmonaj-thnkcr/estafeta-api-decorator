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
exports.asignGuideToOrder = void 0;
const client_1 = require("../commercetools/client");
const asignGuideToOrder = (customer, order) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
    debugger;
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            sort: "createdAt asc",
            limit: 500,
            where: `customerId in ("${customer.id}") and custom(fields(type-order="service"))`
        }
    }).execute();
    //Filtrar las ordenes que son combos
    const combos = orders.body.results.filter(item => item.lineItems.some(line => { var _a, _b; return ((_b = (_a = line.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "UNIZONA"; }));
    const guias = [];
    const ordenToDeleteGuide = [];
    let newJson = {};
    //Filtrar
    for (const item of order.lineItems) {
        const attr = (_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "servicio")) === null || _b === void 0 ? void 0 : _b.value["label"];
        if (!attr)
            continue;
        for (const combo of combos) {
            let count = 0;
            if (guias.length >= item.quantity) {
                count = 0;
                break;
            }
            const service = (_c = combo.lineItems.find(line => { var _a, _b; return ((_b = (_a = line.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "servicio")) === null || _b === void 0 ? void 0 : _b.value["label"]) == attr; })) === null || _c === void 0 ? void 0 : _c.id;
            if (!service)
                continue;
            debugger;
            const jsonService = ((_d = combo.custom) === null || _d === void 0 ? void 0 : _d.fields["services"]) && JSON.parse((_e = combo === null || combo === void 0 ? void 0 : combo.custom) === null || _e === void 0 ? void 0 : _e.fields["services"]);
            if (!jsonService)
                continue;
            if (jsonService[service].guides.length <= 0)
                continue;
            for (const guide of jsonService[service].guides) {
                if (guias.length >= item.quantity)
                    break;
                //@ts-ignore
                guias.push(guide);
                count++;
                const ordenFind = ordenToDeleteGuide.find(orden => orden.id == combo.id);
                if (!ordenFind)
                    ordenToDeleteGuide.push({ id: combo.id, version: combo.version, type: attr, quantity: count });
                else
                    ordenFind.quantity = count;
            }
        }
        for (const element of guias) {
            if (!newJson[item.id]) {
                newJson[item.id] = {
                    sku: (_g = (_f = item.variant) === null || _f === void 0 ? void 0 : _f.sku) !== null && _g !== void 0 ? _g : "",
                    code: "",
                    orderSap: "",
                    guides: [] // Inicializa guides como un array
                };
            }
            (_j = (_h = newJson[item.id]) === null || _h === void 0 ? void 0 : _h.guides) === null || _j === void 0 ? void 0 : _j.push(Object.assign(Object.assign({}, element), { isItemDimensionsExceeded: (_k = item === null || item === void 0 ? void 0 : item.custom) === null || _k === void 0 ? void 0 : _k.fields["isItemDimensionsExceeded"], isItemWeightExceeded: (_l = item === null || item === void 0 ? void 0 : item.custom) === null || _l === void 0 ? void 0 : _l.fields["isItemWeightExceeded"], isPackage: (_m = item === null || item === void 0 ? void 0 : item.custom) === null || _m === void 0 ? void 0 : _m.fields["isPackage"], isPudo: (_o = item === null || item === void 0 ? void 0 : item.custom) === null || _o === void 0 ? void 0 : _o.fields["isPudo"], itemHeight: (_p = item === null || item === void 0 ? void 0 : item.custom) === null || _p === void 0 ? void 0 : _p.fields["itemHeight"], itemLength: (_q = item === null || item === void 0 ? void 0 : item.custom) === null || _q === void 0 ? void 0 : _q.fields["itemLength"], itemVolumen: (_r = item === null || item === void 0 ? void 0 : item.custom) === null || _r === void 0 ? void 0 : _r.fields["itemVolumen"], itemWeight: (_s = item === null || item === void 0 ? void 0 : item.custom) === null || _s === void 0 ? void 0 : _s.fields["itemWeight"], itemWidth: (_t = item === null || item === void 0 ? void 0 : item.custom) === null || _t === void 0 ? void 0 : _t.fields["itemWidth"], Recoleccion: (_u = item === null || item === void 0 ? void 0 : item.custom) === null || _u === void 0 ? void 0 : _u.fields["Recoleccion"], address: JSON.parse((_x = (_w = (_v = item === null || item === void 0 ? void 0 : item.custom) === null || _v === void 0 ? void 0 : _v.fields) === null || _w === void 0 ? void 0 : _w["origen-destino"]) !== null && _x !== void 0 ? _x : "{}") }));
        }
        for (const guidesToDelete of ordenToDeleteGuide) {
            const combo = combos.find(combo => combo.id == guidesToDelete.id);
            if (!combo)
                continue;
            debugger;
            const service = (_y = combo.lineItems.find(line => { var _a, _b; return ((_b = (_a = line.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "servicio")) === null || _b === void 0 ? void 0 : _b.value["label"]) == attr; })) === null || _y === void 0 ? void 0 : _y.id;
            if (!service)
                continue;
            const jsonService = ((_z = combo.custom) === null || _z === void 0 ? void 0 : _z.fields["services"]) && JSON.parse((_0 = combo === null || combo === void 0 ? void 0 : combo.custom) === null || _0 === void 0 ? void 0 : _0.fields["services"]);
            const guides = jsonService[service].guides.slice(item.quantity);
            const newServiceJson = {
                [service]: {
                    code: "",
                    sku: "",
                    orderSap: "",
                    guides: [
                        ...guides,
                    ]
                }
            };
            yield client_1.apiRoot.orders().withId({ ID: guidesToDelete.id }).post({
                body: {
                    version: guidesToDelete.version,
                    actions: [
                        {
                            action: 'setCustomField',
                            name: 'services',
                            value: JSON.stringify(newServiceJson)
                        }
                    ]
                }
            }).execute();
        }
    }
    //Discount
    let guidesTerrestresAvailables = 0;
    let guidesDosDiasAvailables = 0;
    let guidesDiaSiguienteAvailables = 0;
    let guidesDoceTreinteAvailables = 0;
    let versionCustomer = customer.version;
    for (const line of order.lineItems) {
        const attrService = (_2 = (_1 = line.variant.attributes) === null || _1 === void 0 ? void 0 : _1.find(item => item.name == "servicio")) === null || _2 === void 0 ? void 0 : _2.value["label"];
        if (attrService == "DIA SIGUIENTE") {
            const quantityGuideAvailables = (_3 = customer.custom) === null || _3 === void 0 ? void 0 : _3.fields["quantity-guides-dia-siguiente"];
            const quantityNew = quantityGuideAvailables - line.quantity;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-dia-siguiente",
                            value: quantityNew
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            guidesDiaSiguienteAvailables = ((_4 = customer.custom) === null || _4 === void 0 ? void 0 : _4.fields['quantity-guides-dia-siguiente-used']) + 1;
        }
        else if (attrService == "TERRESTRE") {
            const quantityGuideAvailables = (_5 = customer.custom) === null || _5 === void 0 ? void 0 : _5.fields["quantity-guides-terrestres"];
            const quantityNew = quantityGuideAvailables - line.quantity;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-terrestres",
                            value: quantityNew
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            guidesTerrestresAvailables = ((_6 = customer.custom) === null || _6 === void 0 ? void 0 : _6.fields['quantity-guides-terrestres-used']) + line.quantity;
        }
        else if (attrService == "DOS DIAS") {
            const quantityGuideAvailables = (_7 = customer.custom) === null || _7 === void 0 ? void 0 : _7.fields["quantity-guides-dos-dias"];
            const quantityNew = quantityGuideAvailables - line.quantity;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-dos-dias",
                            value: quantityNew
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            guidesDosDiasAvailables = ((_8 = customer.custom) === null || _8 === void 0 ? void 0 : _8.fields['quantity-guides-dos-dias-used']) + line.quantity;
        }
        else if (attrService == "12:30") {
            const quantityGuideAvailables = (_9 = customer.custom) === null || _9 === void 0 ? void 0 : _9.fields["quantity-guides-doce-treinta"];
            const quantityNew = quantityGuideAvailables - line.quantity;
            const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: customer.id }).post({
                body: {
                    version: versionCustomer,
                    actions: [
                        {
                            action: "setCustomField",
                            name: "quantity-guides-doce-treinta",
                            value: quantityNew
                        }
                    ]
                }
            }).execute();
            versionCustomer = updateQuantityUser.body.version;
            guidesDoceTreinteAvailables = ((_10 = customer.custom) === null || _10 === void 0 ? void 0 : _10.fields['quantity-guides-doce-treinta-used']) + line.quantity;
        }
    }
    yield updateUserWithGuidesAvailables(customer.id, versionCustomer, guidesTerrestresAvailables, guidesDosDiasAvailables, guidesDiaSiguienteAvailables, guidesDoceTreinteAvailables);
    debugger;
    return newJson;
});
exports.asignGuideToOrder = asignGuideToOrder;
const updateUserWithGuidesAvailables = (idCustomer, versionCustomer, guidesTerrestresAvailables, guidesDosDiasAvailables, guidesDiaSiguienteAvailables, guidesDoceTreinteAvailables) => __awaiter(void 0, void 0, void 0, function* () {
    if (guidesDiaSiguienteAvailables > 0) {
        const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: idCustomer }).post({
            body: {
                version: versionCustomer,
                actions: [
                    {
                        action: "setCustomField",
                        name: "quantity-guides-dia-siguiente-used",
                        value: guidesDiaSiguienteAvailables
                    }
                ]
            }
        }).execute();
        versionCustomer = updateQuantityUser.body.version;
    }
    if (guidesDosDiasAvailables > 0) {
        const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: idCustomer }).post({
            body: {
                version: versionCustomer,
                actions: [
                    {
                        action: "setCustomField",
                        name: "quantity-guides-dos-dias-used",
                        value: guidesDosDiasAvailables
                    }
                ]
            }
        }).execute();
        versionCustomer = updateQuantityUser.body.version;
    }
    if (guidesDoceTreinteAvailables > 0) {
        const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: idCustomer }).post({
            body: {
                version: versionCustomer,
                actions: [
                    {
                        action: "setCustomField",
                        name: "quantity-guides-doce-treinta-used",
                        value: guidesDoceTreinteAvailables
                    }
                ]
            }
        }).execute();
        versionCustomer = updateQuantityUser.body.version;
    }
    if (guidesTerrestresAvailables > 0) {
        const updateQuantityUser = yield client_1.apiRoot.customers().withId({ ID: idCustomer }).post({
            body: {
                version: versionCustomer,
                actions: [
                    {
                        action: "setCustomField",
                        name: "quantity-guides-terrestres-used",
                        value: guidesTerrestresAvailables
                    }
                ]
            }
        }).execute();
        versionCustomer = updateQuantityUser.body.version;
    }
});
