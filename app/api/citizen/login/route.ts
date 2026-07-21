import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE, citizenSessionCookieOptions, createCitizenSessionToken } from "@/lib/citizen-auth";
import { authenticateCitizen } from "@/lib/portal";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const user = await authenticateCitizen(payload?.email, payload?.password);
  if (!user) return Response.json({ message: "Email atau kata sandi tidak valid." }, { status: 401 });
  const store = await cookies();
  store.set(CITIZEN_SESSION_COOKIE, createCitizenSessionToken(user.id, user.email), citizenSessionCookieOptions);
  return Response.json({ ok: true, user });
}
