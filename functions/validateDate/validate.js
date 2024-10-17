"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDate = checkDate;
function checkDate(date, endDate) {
    const dateOrder = new Date(date);
    let dateNow;
    if (endDate) {
        dateNow = new Date(endDate);
    }
    else {
        dateNow = new Date();
    }
    console.log(dateNow);
    console.log(dateOrder);
    const dayDiff = dateNow.getTime() - dateOrder.getTime();
    const diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
    return diferenciaDias;
}
