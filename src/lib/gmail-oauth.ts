const callbackPath = "/api/gmail/oauth/callback";

function isLocalUrl(value: string) {
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function getGmailRedirectUri(requestOrigin?: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured && (process.env.NODE_ENV !== "production" || !isLocalUrl(configured))) return configured;

  const candidates = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.NEXTAUTH_URL,
    requestOrigin,
    process.env.VERCEL_URL,
  ].filter((value): value is string => Boolean(value?.trim())).map(withProtocol);

  const base = process.env.NODE_ENV === "production"
    ? candidates.find(value => !isLocalUrl(value))
    : candidates[0] || "http://localhost:3000";

  if (!base) throw new Error("Gmail OAuth callback URL is not configured");
  return new URL(callbackPath, base).toString();
}

export function gmailConfigurationStatus(requestOrigin?: string) {
  let redirectUri = "";
  let callbackReady = true;
  try { redirectUri = getGmailRedirectUri(requestOrigin); } catch { callbackReady = false; }
  return {
    clientReady: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    callbackReady,
    redirectUri,
  };
}
