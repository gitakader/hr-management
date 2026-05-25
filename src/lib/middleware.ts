import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import { initDb } from "./db";

export type AuthHandler = (
  req: NextRequest,
  context: { user: JWTPayload; params: Record<string, string> }
) => Promise<NextResponse>;

export function withAuth(
  handler: AuthHandler,
  allowedRoles?: string[]
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const params = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await initDb(); // Initialize DB
    return handler(req, { user, params });
  };
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.split(" ")[1]);
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
