const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is not configured")
}

const apiBaseUrl = /^([a-z][a-z\d+.-]*:)?\/\//i.test(configuredApiBaseUrl)
  ? configuredApiBaseUrl.replace(/\/+$/, "")
  : `https://${configuredApiBaseUrl.replace(/\/+$/, "")}`

export { apiBaseUrl }
