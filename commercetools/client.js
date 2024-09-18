import { ctpClient } from './buildClient.js';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { CTP_PROJECT_KEY } from './credentials.js';

export const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({ projectKey: CTP_PROJECT_KEY });