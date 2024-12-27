"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDate = checkDate;
function checkDate(date, endDate) {
    const dateOrder = new Date(date);
    const dateNow = endDate ? new Date(endDate) : new Date();
    dateOrder.setHours(0, 0, 0, 0);
    dateNow.setHours(0, 0, 0, 0);
    console.log('Fecha enviada (normalizada):', dateOrder);
    console.log('Fecha actual (normalizada):', dateNow);
    const dayDiff = dateNow.getTime() - dateOrder.getTime();
    const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
    return diferenciaDias;
}
