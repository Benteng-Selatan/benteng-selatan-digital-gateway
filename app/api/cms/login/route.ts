import { cookies } from "next/headers";
import { createSessionToken, credentialsAreValid, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clientAddress, enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  try {
    await enforceRateLimit({
      scope: "cms-login",
      identifier: clientAddress(request),
      limit: 5,
      windowSeconds: 15 * 60,
    });

    const payload = await request.json().catch(() => null) as { username?: string; password?: string } | null;
    const username = payload?.username?.trim() || "";
    const password = payload?.password || "";

    if (!credentialsAreValid(username, password)) {
      return Response.json({ message: "Nama pengguna atau kata sandi tidak valid." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, createSessionToken(username), sessionCookieOptions);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: "Login gagal diproses." }, { status: 500 });
  }
}
