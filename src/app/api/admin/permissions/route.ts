import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { getAllPermissions, upsertPermissionAssignment } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);
  const permissions = getAllPermissions();
  return successResponse(permissions);
});

export const POST = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);
  const { userId, permissionId, granted } = await req.json();
  upsertPermissionAssignment(userId, permissionId, granted);
  return successResponse({ updated: true });
});
