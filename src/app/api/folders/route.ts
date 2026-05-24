import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const applicationId = searchParams.get("applicationId");

  let where: any = {};

  if (parentId === "null" || !parentId) {
    where.parentId = null;
  } else {
    where.parentId = parseInt(parentId);
  }

  if (applicationId) {
    where.applicationId = parseInt(applicationId);
  }

  // Admins see everything, applicants see their own folders
  if (user.role === "applicant" && !applicationId) {
    // Only show root folders related to their applications
    const userApps = await prisma.application.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    where.applicationId = { in: userApps.map(a => a.id) };
  }

  const folders = await prisma.folder.findMany({
    where,
    orderBy: [{ isFile: "asc" }, { name: "asc" }],
  });

  return successResponse(folders);
});

export const POST = withAuth(async (req, { user }) => {
  if (!["admin", "manager"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  try {
    const body = await req.json();
    const folder = await prisma.folder.create({
      data: {
        name: body.name,
        applicationId: body.applicationId ? parseInt(body.applicationId) : null,
        parentId: body.parentId ? parseInt(body.parentId) : null,
        isFile: body.isFile || false,
        filepath: body.filepath || "",
        mimetype: body.mimetype || "",
      },
    });
    return successResponse(folder, 201);
  } catch (error) {
    return errorResponse("Failed to create folder", 500);
  }
});
