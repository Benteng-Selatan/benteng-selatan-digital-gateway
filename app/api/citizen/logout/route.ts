import { cookies } from "next/headers";
import { CITIZEN_SESSION_COOKIE } from "@/lib/citizen-auth";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const store = await cookies();
  store.delete(CITIZEN_SESSION_COOKIE);
  return Response.json({ ok: true });
}
