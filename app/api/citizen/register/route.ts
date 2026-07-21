import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE, citizenSessionCookieOptions, createCitizenSessionToken } from "@/lib/citizen-auth";
import { registerCitizen } from "@/lib/portal";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) return Response.json({ message: "Data pendaftaran tidak valid." }, { status: 400 });
    const user = await registerCitizen(payload);
    const store = await cookies();
    store.set(CITIZEN_SESSION_COOKIE, createCitizenSessionToken(user.id, user.email), citizenSessionCookieOptions);
    return Response.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pendaftaran gagal." }, { status: 400 });
  }
}
