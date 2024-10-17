"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormaterDate = void 0;
var FormaterDate = function (date, withTime) {
    if (!date || date == '')
        return '';
    var newDate = new Date(date);
    var configDate = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    var configTime = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    //@ts-ignore
    var formattedDate = newDate.toLocaleDateString('es-ES', __assign(__assign({}, configDate), (withTime ? configTime : {})));
    return formattedDate.replace(',', '');
};
exports.FormaterDate = FormaterDate;
