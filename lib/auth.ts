import { cookies } from "next/headers";

export async function checkAuth() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("auth");

  if (!auth || auth.value !== "true") {
    return false;
  }

  return true;
}
