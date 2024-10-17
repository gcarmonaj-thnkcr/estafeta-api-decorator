"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoot = void 0;
const buildClient_js_1 = require("./buildClient.js");
const platform_sdk_1 = require("@commercetools/platform-sdk");
const credentials_js_1 = require("./credentials.js");
exports.apiRoot = (0, platform_sdk_1.createApiBuilderFromCtpClient)(buildClient_js_1.ctpClient).withProjectKey({ projectKey: credentials_js_1.CTP_PROJECT_KEY });
