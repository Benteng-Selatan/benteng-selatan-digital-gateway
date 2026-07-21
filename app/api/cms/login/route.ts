import { cookies } from "next/headers";
import { createSessionToken, credentialsAreValid, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = payload?.username?.trim() || "";
  const password = payload?.password || "";

  if (!credentialsAreValid(username, password)) {
    return Response.json({ message: "Nama pengguna atau kata sandi tidak valid." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(username), sessionCookieOptions);
  return Response.json({ ok: true });
}
