"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDate = checkDate;
function checkDate(date, endDate) {
    const dateOrder = new Date(date);
    const dateNow = endDate ? new Date(endDate) : new Date();
    // Normalizar ambas fechas al principio del día en la zona local
    dateOrder.setHours(0, 0, 0, 0);
    dateNow.setHours(0, 0, 0, 0);
    console.log('Date Now:', dateNow.toLocaleDateString());
    console.log('Date Order:', dateOrder.toLocaleDateString());
    const dayDiff = dateNow.getTime() - dateOrder.getTime();
    const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
    return diferenciaDias;
}
