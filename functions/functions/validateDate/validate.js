"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDate = checkDate;
function checkDate(date, endDate) {
    var dateOrder = new Date(date);
    var dateNow;
    if (endDate) {
        dateNow = new Date(endDate);
    }
    else {
        dateNow = new Date();
    }
    var dayDiff = dateNow.getTime() - dateOrder.getTime();
    var diferenciaDias = Math.floor(dayDiff / (1000 * 60 * 60 * 24));
    return diferenciaDias;
}
