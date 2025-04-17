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
exports.createReport = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const client_1 = require("../commercetools/client");
const createReport = (dateState, dateEnd) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const convertDateState = new Date(dateState).toISOString();
    const convertDateEnd = new Date(dateEnd).toISOString();
    console.log(convertDateEnd, convertDateState);
    const orders = yield client_1.apiRoot.orders().get({
        queryArgs: {
            expand: "paymentInfo.payments[*]",
            limit: 500,
            sort: "createdAt desc",
            where: `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEnd}"`
        }
    }).execute();
    if (!orders.statusCode || orders.statusCode >= 300)
        return { status: (_a = orders === null || orders === void 0 ? void 0 : orders.statusCode) !== null && _a !== void 0 ? _a : 404, message: "Orders not found" };
    if (orders.body.results.length <= 0)
        return { status: 404, message: "Orders not found" };
    const workBookFormat = yield mapReportExcel(orders.body.results);
    return {
        status: 200,
        message: "",
        data: workBookFormat
    };
});
exports.createReport = createReport;
const mapReportExcel = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const workBook = new exceljs_1.default.Workbook();
    const workSheet = workBook.addWorksheet("Reporte");
    workSheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 10 },
        { header: 'Customer Name', key: 'customerName', width: 32 },
        { header: 'No of Order lines', key: 'ordersLines', width: 32 },
        { header: 'Total Quantity of Items', key: 'totalItems', width: 32 },
        { header: 'Payment Status', key: 'paymentStatus', width: 32 },
        { header: 'Shipment Status', key: 'shipmentStatus', width: 32 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Date Created', key: 'dateCreated', width: 32 },
        { header: 'Date Modified', key: 'dateModified', width: 32 },
        { header: 'Transaction Id', key: 'transactionId', width: 32 },
    ];
    for (const order of orders) {
        const customer = yield client_1.apiRoot.customers().withId({ ID: (_a = order === null || order === void 0 ? void 0 : order.customerId) !== null && _a !== void 0 ? _a : "" }).get().execute();
        workSheet.addRow({
            orderNumber: (_b = order === null || order === void 0 ? void 0 : order.orderNumber) !== null && _b !== void 0 ? _b : "",
            customerName: customer.body.firstName,
            ordersLines: order.lineItems.length,
            totalItems: 10,
            paymentStatus: order.paymentState,
            shipmentStatus: order.shipmentState,
            email: customer.body.email,
            dateCreated: order.createdAt,
            dateModified: order.lastModifiedAt,
            transactionId: (_d = (_c = order.paymentInfo) === null || _c === void 0 ? void 0 : _c.payments[0].obj) === null || _d === void 0 ? void 0 : _d.interfaceId
        });
    }
    return workBook;
});
