import { cookies } from "next/headers";
const secret = process.env.AUTH_SECRET!;

function toBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function stringToBase64(str: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

function base64ToString(base64: string) {
  return new TextDecoder().decode(
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
  );
}

function fromBase64(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  return verifyAuthToken(token);
}
async function getKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signAuthToken() {
  const payload = JSON.stringify({
    exp: Date.now() + 1000 * 60 * 60 * 8,
  });

  const enc = new TextEncoder();
  const key = await getKey();

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));

  const sig = toBase64(signature);
  const payloadB64 = stringToBase64(payload);

  return payloadB64 + "." + sig;
}

export async function verifyAuthToken(token?: string) {
  if (!token) return false;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  const payload = base64ToString(payloadB64);

  const enc = new TextEncoder();
  const key = await getKey();

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64(sig),
    enc.encode(payload),
  );

  if (!valid) return false;

  const data = JSON.parse(payload);

  if (Date.now() > data.exp) return false;

  return true;
}
