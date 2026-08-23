import axios from 'axios';
import crypto from 'crypto';
import { authorizeB2 } from '../config/b2Client.js';

async function getUploadUrl() {
  const { apiUrl, authorizationToken } = await authorizeB2();
  const res = await axios.post(
    `${apiUrl}/b2api/v3/b2_get_upload_url`,
    { bucketId: process.env.B2_BUCKET_ID },
    { headers: { Authorization: authorizationToken } }
  );
  return res.data; // { uploadUrl, authorizationToken }
}

export async function uploadFile(fileBuffer, fileName, contentType) {
  const { uploadUrl, authorizationToken } = await getUploadUrl();
  const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

  const res = await axios.post(uploadUrl, fileBuffer, {
    headers: {
      Authorization: authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': contentType || 'b2/x-auto',
      'Content-Length': fileBuffer.length,
      'X-Bz-Content-Sha1': sha1,
    },
    maxBodyLength: Infinity,
  });

  return res.data;
}