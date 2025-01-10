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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTP_SCOPES = exports.CTP_API_URL = exports.CTP_AUTH_URL = exports.CTP_CLIENT_ID = exports.CTP_CLIENT_SECRET = exports.CTP_PROJECT_KEY = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
console.log("Project", process.env.CTP_PROJECT_KEY);
exports.CTP_PROJECT_KEY = (_a = process.env.CTP_PROJECT_KEY) !== null && _a !== void 0 ? _a : "";
exports.CTP_CLIENT_SECRET = (_b = process.env.CTP_CLIENT_SECRET) !== null && _b !== void 0 ? _b : "";
exports.CTP_CLIENT_ID = (_c = process.env.CTP_CLIENT_ID) !== null && _c !== void 0 ? _c : "";
exports.CTP_AUTH_URL = (_d = process.env.CTP_AUTH_URL) !== null && _d !== void 0 ? _d : "";
exports.CTP_API_URL = (_e = process.env.CTP_API_URL) !== null && _e !== void 0 ? _e : "";
exports.CTP_SCOPES = (_f = process.env.CTP_SCOPES) !== null && _f !== void 0 ? _f : "";
