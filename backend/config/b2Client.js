import axios from 'axios';
import https from 'https';

export const b2HttpsAgent = new https.Agent({
  family: 4,
  keepAlive: true,
});

const DEFAULT_B2_TIMEOUT_MS = 60_000;
const B2_AUTH_RETRIES = 3;

function getB2Timeout() {
  const configuredTimeout = Number.parseInt(process.env.B2_REQUEST_TIMEOUT_MS, 10);
  return Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_B2_TIMEOUT_MS;
}

function isTransientNetworkError(error) {
  return ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK'].includes(error?.code)
    || (error?.request && !error?.response);
}

let authCache = null;
let authCacheExpiry = 0;

export async function authorizeB2() {
  const now = Date.now();
  if (authCache && now < authCacheExpiry) return authCache;

  const credentials = Buffer.from(
    `${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64');

  let res;
  for (let attempt = 1; attempt <= B2_AUTH_RETRIES; attempt += 1) {
    try {
      res = await axios.get(
        'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
        {
          headers: { Authorization: `Basic ${credentials}` },
          httpsAgent: b2HttpsAgent,
          timeout: getB2Timeout(),
        }
      );
      break;
    } catch (error) {
      if (!isTransientNetworkError(error) || attempt === B2_AUTH_RETRIES) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  authCache = {
    apiUrl: res.data.apiInfo.storageApi.apiUrl,
    downloadUrl: res.data.apiInfo.storageApi.downloadUrl,
    authorizationToken: res.data.authorizationToken,
  };
  authCacheExpiry = now + 23 * 60 * 60 * 1000;

  return authCache;
}

export const b2RequestTimeout = getB2Timeout;