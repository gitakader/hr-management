import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const permissions = await prisma.permission.findMany({
    include: { assignments: { include: { user: { select: { id: true, fullName: true, role: true } } } } },
  });

  return successResponse(permissions);
});

export const POST = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const { userId, permissionId, granted } = await req.json();

  const assignment = await prisma.permissionAssignment.upsert({
    where: { userId_permissionId: { userId, permissionId } },
    update: { granted },
    create: { userId, permissionId, granted },
  });

  return successResponse(assignment);
});
