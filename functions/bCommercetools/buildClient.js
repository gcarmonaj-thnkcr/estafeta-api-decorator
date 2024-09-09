import {
  ClientBuilder,
} from '@commercetools/sdk-client-v2';
import { CTP_API_URL, CTP_AUTH_URL, CTP_CLIENT_ID, CTP_CLIENT_SECRET, CTP_PROJECT_KEY, CTP_SCOPES } from './credentials.js';


const scopes = [CTP_SCOPES];
const projectKey=CTP_PROJECT_KEY


const authMiddlewareOptions = {
  host: CTP_AUTH_URL,
  projectKey,
  credentials: {
    clientId: CTP_CLIENT_ID,
    clientSecret: CTP_CLIENT_SECRET,
  },
  scopes,
  fetch: globalThis.fetch,
};

const httpMiddlewareOptions = {
  host: CTP_API_URL,
  fetch: globalThis.fetch,
};

export const ctpClient = new ClientBuilder()
  .withProjectKey(projectKey) // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .withLoggerMiddleware() // Include middleware for logging
  .build();
