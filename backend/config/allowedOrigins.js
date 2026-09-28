// Comma-separated list, e.g. "https://accentra.up.railway.app,http://localhost:5173"
export const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());