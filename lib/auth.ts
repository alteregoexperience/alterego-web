import { cookies } from "next/headers";
const secret = process.env.AUTH_SECRET!;

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

  const sig = Buffer.from(signature).toString("base64");

  return Buffer.from(payload).toString("base64") + "." + sig;
}

export async function verifyAuthToken(token?: string) {
  if (!token) return false;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  const payload = Buffer.from(payloadB64, "base64").toString();

  const enc = new TextEncoder();
  const key = await getKey();

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(sig, "base64"),
    enc.encode(payload),
  );

  if (!valid) return false;

  const data = JSON.parse(payload);

  if (Date.now() > data.exp) return false;

  return true;
}
