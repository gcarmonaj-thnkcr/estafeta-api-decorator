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
    var _a, _b;
    const convertDateState = new Date(dateState).toISOString();
    const convertDateEnd = new Date(dateEnd).toISOString();
    const addOneDay = new Date(convertDateEnd);
    addOneDay.setDate(addOneDay.getDate() + 1);
    const convertDateEndPlusOne = addOneDay.toISOString();
    const orders = [];
    const queryOrder = yield client_1.apiRoot.orders().get({
        queryArgs: {
            expand: "paymentInfo.payments[*]",
            offset: 0,
            limit: 500,
            sort: "createdAt desc",
            where: `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEndPlusOne}"`
        }
    }).execute();
    if (!queryOrder.statusCode || queryOrder.statusCode >= 300)
        return { status: (_a = queryOrder === null || queryOrder === void 0 ? void 0 : queryOrder.statusCode) !== null && _a !== void 0 ? _a : 404, message: "Orders not found" };
    if (queryOrder.body.results.length <= 0)
        return { status: 404, message: "Orders not found" };
    orders.push(...queryOrder.body.results);
    let offset = 500;
    let hasNext = true;
    while (hasNext) {
        const queryOrder = yield client_1.apiRoot.orders().get({
            queryArgs: {
                expand: "paymentInfo.payments[*]",
                offset: offset,
                limit: 500,
                sort: "createdAt desc",
                where: `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEndPlusOne}"`
            }
        }).execute();
        if (!queryOrder.statusCode || queryOrder.statusCode >= 300)
            return { status: (_b = queryOrder === null || queryOrder === void 0 ? void 0 : queryOrder.statusCode) !== null && _b !== void 0 ? _b : 404, message: "Orders not found" };
        if (queryOrder.body.results.length <= 0)
            hasNext = false;
        orders.push(...queryOrder.body.results);
        offset += 500;
        if (offset >= 10000)
            hasNext = false;
        console.log("offset", offset);
    }
    console.log("orders length", orders.length);
    const workBookFormat = yield processOrdersInBatches(orders, 10);
    return {
        status: 200,
        message: "",
        data: workBookFormat
    };
});
exports.createReport = createReport;
const mapReportExcel = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
        { header: 'Motor de Pago', key: 'motorPago', width: 32 },
        { header: 'Total a Pagar', key: 'totalAmount', width: 32 },
    ];
    for (const order of orders) {
        const customer = yield client_1.apiRoot.customers().withId({ ID: (_a = order === null || order === void 0 ? void 0 : order.customerId) !== null && _a !== void 0 ? _a : "" }).get().execute();
        const quantityItems = order.lineItems.reduce((acc, item) => acc + item.quantity, 0);
        workSheet.addRow({
            orderNumber: (_b = order === null || order === void 0 ? void 0 : order.orderNumber) !== null && _b !== void 0 ? _b : "",
            customerName: `${customer.body.firstName} ${(_d = (_c = customer === null || customer === void 0 ? void 0 : customer.body) === null || _c === void 0 ? void 0 : _c.lastName) !== null && _d !== void 0 ? _d : ""}`,
            ordersLines: order.lineItems.length,
            totalItems: quantityItems,
            paymentStatus: order.paymentState,
            shipmentStatus: (_e = order === null || order === void 0 ? void 0 : order.shipmentState) !== null && _e !== void 0 ? _e : "",
            email: customer.body.email,
            dateCreated: order.createdAt,
            dateModified: order.lastModifiedAt,
            transactionId: (_h = (_g = (_f = order.paymentInfo) === null || _f === void 0 ? void 0 : _f.payments[0].obj) === null || _g === void 0 ? void 0 : _g.interfaceId) !== null && _h !== void 0 ? _h : "",
            motorPago: (_k = (_j = order.paymentInfo) === null || _j === void 0 ? void 0 : _j.payments[0].obj) === null || _k === void 0 ? void 0 : _k.paymentMethodInfo.paymentInterface,
            totalAmount: order.totalPrice.centAmount / 100
        });
    }
    return workBook;
});
function processOrdersInBatches(orders_1) {
    return __awaiter(this, arguments, void 0, function* (orders, batchSize = 10) {
        const batches = [];
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
            { header: 'Motor de Pago', key: 'motorPago', width: 32 },
            { header: 'Total a Pagar', key: 'totalAmount', width: 32 },
        ];
        for (let i = 0; i < orders.length; i += batchSize) {
            batches.push(orders.slice(i, i + batchSize));
        }
        console.log("batches", batches);
        for (const batch of batches) {
            console.log(batch);
            const customerPromises = batch.map(order => {
                var _a;
                return client_1.apiRoot.customers().withId({ ID: (_a = order === null || order === void 0 ? void 0 : order.customerId) !== null && _a !== void 0 ? _a : "" }).get().execute()
                    .catch(() => ({ body: { firstName: '', lastName: '', email: '' } }));
            });
            const customers = yield Promise.all(customerPromises);
            batch.forEach((order, index) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                console.log(order.id);
                const customer = customers[index];
                const quantityItems = order.lineItems.reduce((acc, item) => acc + item.quantity, 0);
                workSheet.addRow({
                    orderNumber: (_a = order === null || order === void 0 ? void 0 : order.orderNumber) !== null && _a !== void 0 ? _a : "",
                    customerName: `${customer.body.firstName} ${(_c = (_b = customer === null || customer === void 0 ? void 0 : customer.body) === null || _b === void 0 ? void 0 : _b.lastName) !== null && _c !== void 0 ? _c : ""}`,
                    ordersLines: order.lineItems.length,
                    totalItems: quantityItems,
                    paymentStatus: order.paymentState,
                    shipmentStatus: (_d = order === null || order === void 0 ? void 0 : order.shipmentState) !== null && _d !== void 0 ? _d : "",
                    email: customer.body.email,
                    dateCreated: order.createdAt,
                    dateModified: order.lastModifiedAt,
                    transactionId: (_g = (_f = (_e = order.paymentInfo) === null || _e === void 0 ? void 0 : _e.payments[0].obj) === null || _f === void 0 ? void 0 : _f.interfaceId) !== null && _g !== void 0 ? _g : "",
                    motorPago: (_j = (_h = order.paymentInfo) === null || _h === void 0 ? void 0 : _h.payments[0].obj) === null || _j === void 0 ? void 0 : _j.paymentMethodInfo.paymentInterface,
                    totalAmount: order.totalPrice.centAmount / 100
                });
            });
        }
        return workBook;
    });
}
