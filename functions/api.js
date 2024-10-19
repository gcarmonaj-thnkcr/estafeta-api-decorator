"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./controllers/pdv/index"));
const index_2 = __importDefault(require("./controllers/lifetimes/index"));
const index_3 = __importDefault(require("./controllers/waybills/index"));
const index_4 = __importDefault(require("./controllers/orders/index"));
const index_5 = __importDefault(require("./controllers/login/index"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/.netlify/functions/api", index_1.default);
app.use("/.netlify/functions/api", index_2.default);
app.use("/.netlify/functions/api", index_3.default);
app.use("/.netlify/functions/api", index_4.default);
app.use("/.netlify/functions/api", index_5.default);
const port = process.env.PORT || 9000;
exports.handler = (0, serverless_http_1.default)(app);
app.listen(port, () => {
    console.log("Server listenning on port" + port);
});
