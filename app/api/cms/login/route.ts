import { cookies } from "next/headers";

import {
  authenticateAdmin,
  createSessionToken,
  publicAdminSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";
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
  const username = payload?.username?.trim().toLowerCase() || "";
  const password = payload?.password || "";
  const rateLimitKey = buildLoginRateLimitKey("cms", username, request);
  const rateLimit = await checkLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return Response.json(
      { message: "Terlalu banyak percobaan login. Silakan coba kembali beberapa saat lagi." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds || 900) } }
    );
  }

  const user = await authenticateAdmin(username, password);
  if (!user) {
    await recordLoginFailure(rateLimitKey);
    await recordAudit({
      action: "auth.login_failed",
      entityType: "staff_session",
      entityId: username,
      metadata: { username },
      context: auditContextFromRequest(request),
    });
    return Response.json({ message: "Nama pengguna atau kata sandi tidak valid." }, { status: 401 });
  }

  await clearLoginRateLimit(rateLimitKey);
  const session = { ...user, expiresAt: 0 };
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
  await recordAudit({
    actor: session,
    action: "auth.login_success",
    entityType: "staff_session",
    entityId: user.userId,
    context: auditContextFromRequest(request),
  });
  return Response.json({ ok: true, user: publicAdminSession(session) });
}
