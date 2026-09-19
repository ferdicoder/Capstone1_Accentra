import axios from 'axios';
import { authorizeB2, b2HttpsAgent } from '../config/b2Client.js';

export async function downloadFile(fileName) {
  const { downloadUrl, authorizationToken } = await authorizeB2();
  const res = await axios.get(
    `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}`,
    {
      headers: { Authorization: authorizationToken },
      responseType: 'arraybuffer',
      httpsAgent: b2HttpsAgent,
      timeout: 15000,
    }
  );
  return res.data;
}