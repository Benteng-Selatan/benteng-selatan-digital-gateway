import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE, citizenSessionCookieOptions, createCitizenSessionToken } from "@/lib/citizen-auth";
import { authenticateCitizen } from "@/lib/portal";
import { clientAddress, enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  try {
    const payload = await request.json().catch(() => null) as { email?: string; password?: string } | null;
    const email = payload?.email?.trim().toLowerCase() || "unknown";
    const address = clientAddress(request);

    await Promise.all([
      enforceRateLimit({ scope: "citizen-login-ip", identifier: address, limit: 10, windowSeconds: 15 * 60 }),
      enforceRateLimit({ scope: "citizen-login-account", identifier: email, limit: 5, windowSeconds: 15 * 60 }),
    ]);

    const user = await authenticateCitizen(payload?.email, payload?.password);
    if (!user) return Response.json({ message: "Email atau kata sandi tidak valid." }, { status: 401 });

    const store = await cookies();
    store.set(CITIZEN_SESSION_COOKIE, createCitizenSessionToken(user.id, user.email), citizenSessionCookieOptions);
    return Response.json({ ok: true, user });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: "Login gagal diproses." }, { status: 500 });
  }
}
