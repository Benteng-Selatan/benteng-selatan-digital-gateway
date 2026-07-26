import { cookies } from "next/headers";

import {
  createSessionToken,
  credentialsAreValid,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  const username = payload?.username?.trim() || "";
  const password = payload?.password || "";

  const rateLimitKey = buildLoginRateLimitKey(
    "cms",
    username,
    request
  );

  const rateLimit = await checkLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return Response.json(
      {
        message:
          "Terlalu banyak percobaan login. Silakan coba kembali beberapa saat lagi.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds || 900),
        },
      }
    );
  }

  if (!credentialsAreValid(username, password)) {
    await recordLoginFailure(rateLimitKey);

    return Response.json(
      {
        message: "Nama pengguna atau kata sandi tidak valid.",
      },
      {
        status: 401,
      }
    );
  }

  await clearLoginRateLimit(rateLimitKey);

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    createSessionToken(username),
    sessionCookieOptions
  );

  return Response.json({ ok: true });
}