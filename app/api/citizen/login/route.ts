import { cookies } from "next/headers";

import {
  CITIZEN_SESSION_COOKIE,
  citizenSessionCookieOptions,
  createCitizenSessionToken,
} from "@/lib/citizen-auth";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { authenticateCitizen } from "@/lib/portal";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = payload?.email?.trim().toLowerCase() || "";
  const password = payload?.password || "";

  const rateLimitKey = buildLoginRateLimitKey(
    "citizen",
    email,
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

  const user = await authenticateCitizen(email, password);

  if (!user) {
    await recordLoginFailure(rateLimitKey);

    return Response.json(
      {
        message: "Email atau kata sandi tidak valid.",
      },
      {
        status: 401,
      }
    );
  }

  await clearLoginRateLimit(rateLimitKey);

  const store = await cookies();

  store.set(
    CITIZEN_SESSION_COOKIE,
    createCitizenSessionToken(user.id, user.email),
    citizenSessionCookieOptions
  );

  return Response.json({
    ok: true,
    user,
  });
}