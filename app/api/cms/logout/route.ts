import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
