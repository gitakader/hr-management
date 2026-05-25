import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { updateUser, deleteUser } from "@/lib/db";

export const PUT = withAuth(async (req, { user, params }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const body = await req.json();
  const data: Record<string, any> = {};
  if (body.isActive !== undefined) data.isActive = body.isActive ? 1 : 0;
  if (body.role) data.role = body.role;

  updateUser(id, data);
  return successResponse({ updated: true });
});

export const DELETE = withAuth(async (req, { user, params }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  deleteUser(id);
  return successResponse({ deleted: true });
});
