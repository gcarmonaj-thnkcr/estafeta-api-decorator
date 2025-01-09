"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invertPrice = void 0;
const invertPrice = (price, vatAppliend) => {
    if (vatAppliend == 0)
        return price;
    if (!vatAppliend)
        vatAppliend = 16;
    const iva = 1 + (vatAppliend / 100);
    const newPrice = price / iva;
    return parseFloat(newPrice.toFixed(6));
};
exports.invertPrice = invertPrice;
