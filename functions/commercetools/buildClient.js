"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ctpClient = void 0;
var sdk_client_v2_1 = require("@commercetools/sdk-client-v2");
var credentials_1 = require("./credentials");
var scopes = [credentials_1.CTP_SCOPES];
var projectKey = credentials_1.CTP_PROJECT_KEY;
// Configure authMiddlewareOptions
var authMiddlewareOptions = {
    host: credentials_1.CTP_AUTH_URL,
    projectKey: projectKey,
    credentials: {
        clientId: credentials_1.CTP_CLIENT_ID,
        clientSecret: credentials_1.CTP_CLIENT_SECRET,
    },
    scopes: scopes,
    fetch: fetch,
};
// Configure httpMiddlewareOptions
var httpMiddlewareOptions = {
    host: credentials_1.CTP_API_URL,
    fetch: fetch,
};
// Export the ClientBuilder
exports.ctpClient = new sdk_client_v2_1.ClientBuilder()
    .withProjectKey(projectKey) // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware() // Include middleware for logging
    .build();
