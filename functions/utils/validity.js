"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidityData = void 0;
const getValidityData = (isPickup = false) => {
    const validityDays = {
        qr: parseInt(process.env.QR_VALIDITY_DAYS || '15'),
        pickup: parseInt(process.env.PDF_VALIDITY_DAYS || '30'),
    };
    let days = isPickup ? validityDays.pickup : validityDays.qr;
    const date = new Date();
    date.setDate(date.getDate() + days);
    let base = {
        qrStatus: 'active',
        validityDays: days,
        validityDate: date.toISOString(),
    };
    if (!isPickup)
        base = Object.assign(Object.assign({}, base), { renovationDate: null, renovationEndDate: null, updatedAddress: false });
    return base;
};
exports.getValidityData = getValidityData;
