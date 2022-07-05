const express = require('express');
const dotenv = require('dotenv');
const proxy = require('express-http-proxy');
const msal = require('@azure/msal-node');

// Load .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const REMOTE = process.env.REMOTE;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const APP_TENANT_ID = process.env.APP_TENANT_ID;
const SCOPE = process.env.SCOPE;
const AAD_ENDPOINT = process.env.AAD_ENDPOINT || 'https://login.microsoftonline.com/';

const requiredVariables = {
  REMOTE,
  APP_ID,
  APP_SECRET,
  SCOPE,
};

Object.keys(requiredVariables).forEach((key) => {
  if (!requiredVariables[key]) {
    throw new Error(`Configuration variable '${key}' must be defined`);
  }
});

const SCOPES = SCOPE.split(',');

const msalClient = new msal.ConfidentialClientApplication({
  auth: {
    clientId: APP_ID,
    clientSecret: APP_SECRET,
    authority: `${AAD_ENDPOINT}${APP_TENANT_ID}`,
  },
});

app.use(
  '/',
  proxy(REMOTE, {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      return new Promise((resolve, reject) => {
        msalClient
          .acquireTokenByClientCredential({
            scopes: SCOPES,
          })
          .then((authResult) => {
            proxyReqOpts.headers[
              'Authorization'
            ] = `${authResult.tokenType} ${authResult.accessToken}`;
            resolve(proxyReqOpts);
          });
      });
    },
  }),
);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
