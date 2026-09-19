import axios from 'axios';
import https from 'https';

export const b2HttpsAgent = new https.Agent({ family: 4 });

let authCache = null;
let authCacheExpiry = 0;

export async function authorizeB2() {
  const now = Date.now();
  if (authCache && now < authCacheExpiry) return authCache;

  const credentials = Buffer.from(
    `${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64');

  const res = await axios.get(
    'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
    {
      headers: { Authorization: `Basic ${credentials}` },
      httpsAgent: b2HttpsAgent,
      timeout: 15000,
    }
  );

  authCache = {
    apiUrl: res.data.apiInfo.storageApi.apiUrl,
    downloadUrl: res.data.apiInfo.storageApi.downloadUrl,
    authorizationToken: res.data.authorizationToken,
  };
  authCacheExpiry = now + 23 * 60 * 60 * 1000;

  return authCache;
}