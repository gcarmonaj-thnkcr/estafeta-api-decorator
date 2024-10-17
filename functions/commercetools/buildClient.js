"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ctpClient = void 0;
const sdk_client_v2_1 = require("@commercetools/sdk-client-v2");
const credentials_1 = require("./credentials");
const scopes = [credentials_1.CTP_SCOPES];
const projectKey = credentials_1.CTP_PROJECT_KEY;
// Configure authMiddlewareOptions
const authMiddlewareOptions = {
    host: credentials_1.CTP_AUTH_URL,
    projectKey,
    credentials: {
        clientId: credentials_1.CTP_CLIENT_ID,
        clientSecret: credentials_1.CTP_CLIENT_SECRET,
    },
    scopes,
    fetch,
};
// Configure httpMiddlewareOptions
const httpMiddlewareOptions = {
    host: credentials_1.CTP_API_URL,
    fetch,
};
// Export the ClientBuilder
exports.ctpClient = new sdk_client_v2_1.ClientBuilder()
    .withProjectKey(projectKey) // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .build();
