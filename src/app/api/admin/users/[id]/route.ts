import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const PUT = withAuth(async (req, { user, params }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const body = await req.json();
  const data: any = {};
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.role) data.role = body.role;

  await prisma.user.update({ where: { id }, data });
  return successResponse({ updated: true });
});

export const DELETE = withAuth(async (req, { user, params }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  await prisma.user.delete({ where: { id } });
  return successResponse({ deleted: true });
});
