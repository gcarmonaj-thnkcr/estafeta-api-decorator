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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSPurchaseOrder = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("./auth");
const codesPurchase_1 = require("../utils/codesPurchase");
const client_1 = require("../commercetools/client");
const getTypeCart = (order) => {
    let attrType = order.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "ZONA"; });
    if (attrType)
        return "ZONA";
    attrType = order.lineItems.some(item => { var _a, _b; return ((_b = (_a = item.variant.attributes) === null || _a === void 0 ? void 0 : _a.find(attr => attr.name == "tipo-paquete")) === null || _b === void 0 ? void 0 : _b.value["label"]) == "UNIZONA"; });
    if (attrType)
        return "UNIZONA";
    return "USO";
};
const WSPurchaseOrder = (_a) => __awaiter(void 0, [_a], void 0, function* ({ order, code, customer, idPaymentService, methodName, quantityTotalGuides }) {
    var _b;
    const typeCart = getTypeCart(order);
    const purchaseLines = createLinePurchase(typeCart, order, code, quantityTotalGuides, customer);
    const data = {
        "purchaseOrder": [
            {
                "SalesOrganizationCode": "87D",
                "code": code,
                "customerMail": (_b = customer.email) !== null && _b !== void 0 ? _b : "",
                "ticketCode": "43099",
                "services": purchaseLines,
                "servicesPay": [
                    {
                        "PurchaseOrderCode": code,
                        "CustomerCode": "000200087D",
                        "TicketCode": "43099",
                        "PaymentMethodName": "Openpay",
                        "PaymentTypeName": "Credit",
                        "TransactionalCode": "OBA-04",
                        "PaymentCardNum": "424242XXXXXX4242",
                        "BankTypeName": "VISA",
                        "BankReferenceCode": "87D01189",
                        "PaymentAmount": order.totalPrice.centAmount / 100.00,
                        "PaidDateTime": "2024-07-17 12:11:45",
                        "PaymentCode": code
                    }
                ],
                "DiscountCode": "0",
                "DiscouentRate": 0,
                "ValueAddTaxRate": 16,
                "SubtotalOrderAmount": order.totalPrice.centAmount / 100.00,
                "DiscountAmount": 0,
                "ValueAddTaxAmount": 16,
                "TotalOrderAmount": order.totalPrice.centAmount / 100.00,
                "statusOorder": "Pagado"
            }
        ]
    };
    const token = yield (0, auth_1.authToken)({ type: 'purchaseOrder' });
    console.log(token);
    const config = {
        method: 'post',
        url: 'https://apimiddlewareinvoiceqa.estafeta.com/TiendaEstafetaAPI/rest/PurchasePortalOrder/Insert',
        headers: {
            APIKEY: '35a7bf4c03f44514b7f100f9bcdfc208',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Cookie: 'dd4f03=4xuDehaAsBXfKXHuNYpioX8SAaJ5WeWSH6rsC+LyveY2vvEGjw2weq+6elv8TGL4ooypquxeH7iU3UhM3I6EiJtLDsqT2qGvmBhbKu8FeSwnxDTjsMG/B8KyTXOD9rBIVUftAp9K1nrKTWdSTmQSgJR0WdgomFHUqPjGLAr1nOoFlNbA',
        },
        data: JSON.stringify(data),
    };
    try {
        const response = yield axios_1.default.request(config);
        debugger;
        console.log(response.data);
        return response.data;
    }
    catch (error) {
        debugger;
        console.error('Error Response: ', error.response);
        console.error('Error Message: ', error.message);
        throw error;
    }
});
exports.WSPurchaseOrder = WSPurchaseOrder;
const updatedCustomer = (idCustomer, fieldToUpdated) => __awaiter(void 0, void 0, void 0, function* () {
    const customerUpdated = yield client_1.apiRoot.customers().get({
        queryArgs: {
            where: `id in ("${idCustomer}")`
        }
    }).execute();
    const userUpdate = yield client_1.apiRoot.customers().withId({ ID: customerUpdated.body.results[0].id }).post({
        body: {
            version: customerUpdated.body.results[0].version,
            actions: [
                {
                    action: "setCustomField",
                    name: fieldToUpdated,
                    value: "0"
                }
            ]
        }
    }).execute();
});
const createLinePurchase = (typeCart, order, code, quantityTotalGuides, customer) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    debugger;
    if (typeCart == "UNIZONA") {
        const servicesLines = order.lineItems
            .filter(line => line.price.value.centAmount > 0)
            .map(line => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
            const type = (_c = (_b = (_a = line === null || line === void 0 ? void 0 : line.variant) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.find(attr => attr.name == "servicio")) === null || _c === void 0 ? void 0 : _c.value["label"];
            const quantity = (_g = (_f = (_e = (_d = line === null || line === void 0 ? void 0 : line.variant) === null || _d === void 0 ? void 0 : _d.attributes) === null || _e === void 0 ? void 0 : _e.find(attr => attr.name == "quantity-items")) === null || _f === void 0 ? void 0 : _f.value) !== null && _g !== void 0 ? _g : 1;
            const nameService = type !== null && type !== void 0 ? type : line.productKey;
            const codeMaterial = (0, codesPurchase_1.getCode)(nameService);
            let legacyCount = "0";
            debugger;
            if (type == "TERRESTRE") {
                legacyCount = (_k = (_j = (_h = customer.custom) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j["quantity-guides-terrestres-legacy"]) !== null && _k !== void 0 ? _k : "0";
                if (legacyCount != "0")
                    updatedCustomer(customer.id, "quantity-guides-terrestres-legacy");
            }
            else if (type == "DOS DIAS") {
                legacyCount = (_o = (_m = (_l = customer.custom) === null || _l === void 0 ? void 0 : _l.fields) === null || _m === void 0 ? void 0 : _m["quantity-dos-dias-legacy"]) !== null && _o !== void 0 ? _o : "0";
                if (legacyCount != "0")
                    updatedCustomer(customer.id, "quantity-guides-dos-dias-legacy");
            }
            else if (type == "DIA SIGUIENTE") {
                legacyCount = (_r = (_q = (_p = customer.custom) === null || _p === void 0 ? void 0 : _p.fields) === null || _q === void 0 ? void 0 : _q["quantity-guides-dia-siguiente-legacy"]) !== null && _r !== void 0 ? _r : "0";
                if (legacyCount != "0")
                    updatedCustomer(customer.id, "quantity-guides-dia-siguiente-legacy");
            }
            else if (type == "DOCE TREINTA") {
                legacyCount = (_u = (_t = (_s = customer.custom) === null || _s === void 0 ? void 0 : _s.fields) === null || _t === void 0 ? void 0 : _t["quantity-guides-doce-treinta-legacy"]) !== null && _u !== void 0 ? _u : "0";
                if (legacyCount != "0")
                    updatedCustomer(customer.id, "quantity-guides-doce-treinta-legacy");
            }
            debugger;
            quantityTotalGuides = quantity * line.quantity + parseInt(legacyCount);
            const purchaseLine = {
                PurchaseOrderCode: code, // Autoincrementable
                customerCode: "000200087D", // Dato fijo
                TicketCode: "43099",
                MaterialCode: codeMaterial.code,
                MaterialName: line.name["es-MX"],
                MaterialQuantity: quantityTotalGuides,
                MaterialPrice: line.price.value.centAmount / 100.00,
                MaterialDiscountAmount: 0,
                MaterialTaxAddAmount: 1,
                SummaryService: 270.700000
            };
            return purchaseLine;
        });
        return servicesLines;
    }
    let servicesLines = [];
    /*
    if(typeCart == "USO") {
      for(const line of cart.lineItems){
          const type = line?.variant?.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"]
          if(type) continue
          const codeMaterial = getCode(line.productKey ?? "")
          servicesLines.push({
              PurchaseOrderCode: code, // Autoincrementable
              customerCode: "000200087D", // Dato fijo
              TicketCode: "43099",
              MaterialCode: codeMaterial.code,
              MaterialName: line.name["es-MX"],
              MaterialQuantity: line.quantity,
              MaterialPrice: line.price.value.centAmount / 100.00,
              MaterialDiscountAmount: 0,
              MaterialTaxAddAmount: 1,
              SummaryService: 270.700000
          })
      }
    }
      */
    for (const line of order.lineItems) {
        const type = (_c = (_b = (_a = line === null || line === void 0 ? void 0 : line.variant) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.find(attr => attr.name == "tipo-paquete")) === null || _c === void 0 ? void 0 : _c.value["label"];
        if (!type)
            continue;
        const adicionales = ((_d = line.custom) === null || _d === void 0 ? void 0 : _d.fields["adicionales"]) && JSON.parse((_e = line.custom) === null || _e === void 0 ? void 0 : _e.fields["adicionales"]);
        const quantity = (_j = (_h = (_g = (_f = line === null || line === void 0 ? void 0 : line.variant) === null || _f === void 0 ? void 0 : _f.attributes) === null || _g === void 0 ? void 0 : _g.find(attr => attr.name == "quantity-items")) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 1;
        const nameService = (_o = (_m = (_l = (_k = line === null || line === void 0 ? void 0 : line.variant) === null || _k === void 0 ? void 0 : _k.attributes) === null || _l === void 0 ? void 0 : _l.find(attr => attr.name == "servicio")) === null || _m === void 0 ? void 0 : _m.value["label"]) !== null && _o !== void 0 ? _o : line.productKey;
        debugger;
        const codeMaterial = (0, codesPurchase_1.getCode)(nameService);
        const indexCodeMaterial = codeMaterial.code.charAt(0);
        quantityTotalGuides = quantity * line.quantity;
        if (line.price.value.centAmount > 0) {
            servicesLines.push({
                PurchaseOrderCode: code, // Autoincrementable
                customerCode: "000200087D", // Dato fijo
                TicketCode: "43099",
                MaterialCode: codeMaterial.code,
                MaterialName: line.name["es-MX"],
                MaterialQuantity: quantity * line.quantity,
                MaterialPrice: line.price.value.centAmount / 100.00,
                MaterialDiscountAmount: 0,
                MaterialTaxAddAmount: 1,
                SummaryService: 270.700000
            });
        }
        debugger;
        if (adicionales) {
            const result = adicionales.reduce((acc, item) => {
                const keys = Object.keys(item);
                keys.forEach(key => {
                    if (item[key] !== '') {
                        // Buscar si el código ya existe en el acumulador
                        const existing = acc.find((obj) => obj.code === key);
                        if (existing) {
                            // Si existe, incrementamos el count
                            existing.count += 1;
                        }
                        else {
                            // Si no existe, lo inicializamos
                            acc.push({
                                code: key,
                                count: 1
                            });
                        }
                    }
                });
                return acc;
            }, []);
            debugger;
            for (const res of result) {
                let name = "";
                if (res.code == "enBio") {
                    name = "enBio";
                }
                else if (res.code == "seguro") {
                    name = "seguro-opcional";
                    continue;
                }
                else if (res.code == "manejable") {
                    name = "manejo-especial";
                    continue;
                }
                debugger;
                const item = order.lineItems.find(item => item.productKey == name);
                if (!item)
                    continue;
                const codeMaterial = (0, codesPurchase_1.getCode)((_p = item.productKey) !== null && _p !== void 0 ? _p : res.code);
                servicesLines.push({
                    PurchaseOrderCode: code, // Autoincrementable
                    customerCode: "000200087D", // Dato fijo
                    TicketCode: "43099",
                    MaterialCode: indexCodeMaterial + codeMaterial.code,
                    MaterialName: item.name["es-MX"],
                    MaterialQuantity: res.count,
                    MaterialPrice: item.price.value.centAmount / 100.00,
                    MaterialDiscountAmount: 0,
                    MaterialTaxAddAmount: 1,
                    SummaryService: 270.700000
                });
            }
        }
    }
    return servicesLines;
};
