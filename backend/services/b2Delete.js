import axios from 'axios';
import { authorizeB2 } from '../config/b2Client.js';

export async function deleteFileVersion(fileName, fileId) {
  const { apiUrl, authorizationToken } = await authorizeB2();
  const res = await axios.post(
    `${apiUrl}/b2api/v3/b2_delete_file_version`,
    { fileName, fileId },
    { headers: { Authorization: authorizationToken } }
  );
  return res.data;
}