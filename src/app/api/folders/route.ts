import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { getFolders, createFolder, getDb } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const parentIdParam = searchParams.get("parentId");
  const applicationIdParam = searchParams.get("applicationId");

  const parentId = parentIdParam === "null" || !parentIdParam ? null : parseInt(parentIdParam);
  const applicationId = applicationIdParam ? parseInt(applicationIdParam) : undefined;

  const folders = getFolders(parentId, applicationId);
  return successResponse(folders);
});

export const POST = withAuth(async (req, { user }) => {
  if (!["admin", "manager"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  try {
    const body = await req.json();
    const folder = createFolder({
      name: body.name,
      applicationId: body.applicationId ? parseInt(body.applicationId) : null,
      parentId: body.parentId ? parseInt(body.parentId) : null,
      isFile: body.isFile || false,
      filepath: body.filepath || "",
      mimetype: body.mimetype || "",
    });
    return successResponse(folder, 201);
  } catch (error) {
    return errorResponse("Failed to create folder", 500);
  }
});
