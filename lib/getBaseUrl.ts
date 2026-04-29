export function getBaseUrl() {
  // Local
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Produccion
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
