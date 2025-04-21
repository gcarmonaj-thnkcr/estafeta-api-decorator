"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv = __importStar(require("dotenv"));
// import data from './mock_values.json' assert { type: 'json'}
const index_1 = __importDefault(require("./controllers/pdv/index"));
const index_2 = __importDefault(require("./controllers/lifetimes/index"));
const index_3 = __importDefault(require("./controllers/waybills/index"));
const index_4 = __importDefault(require("./controllers/orders/index"));
const index_5 = __importDefault(require("./controllers/login/index"));
const index_6 = __importDefault(require("./controllers/webhook/index"));
const index_7 = __importDefault(require("./controllers/quote/index"));
const index_8 = __importDefault(require("./controllers/reprocess/index"));
const index_9 = __importDefault(require("./controllers/report/index"));
const app = (0, express_1.default)();
dotenv.config();
app.use((0, morgan_1.default)('combined'));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/.netlify/functions/api", index_6.default);
app.use("/.netlify/functions/api", index_1.default);
app.use("/.netlify/functions/api", index_2.default);
app.use("/.netlify/functions/api", index_3.default);
app.use("/.netlify/functions/api", index_4.default);
app.use("/.netlify/functions/api", index_5.default);
app.use("/.netlify/functions/api", index_7.default);
app.use("/.netlify/functions/api", index_8.default);
app.use("/.netlify/functions/api", index_9.default);
const port = process.env.PORT || 9000;
exports.handler = (0, serverless_http_1.default)(app);
app.listen(port, () => {
    console.log("Server listenning on port" + port);
});
