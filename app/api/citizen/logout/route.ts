import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE } from "@/lib/citizen-auth";

export async function POST() {
  const store = await cookies();
  store.delete(CITIZEN_SESSION_COOKIE);
  return Response.json({ ok: true });
}
