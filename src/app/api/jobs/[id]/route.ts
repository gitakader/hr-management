import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { getJobPostById, updateJobPost, deleteJobPost } from "@/lib/db";

export const GET = withAuth(async (req, { user, params }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");
  const job = getJobPostById(id);
  if (!job) return errorResponse("Job not found", 404);
  return successResponse(job);
});

export const PUT = withAuth(async (req, { user, params }) => {
  if (!["admin", "manager"].includes(user.role)) return errorResponse("Forbidden", 403);
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");
  const body = await req.json();
  const job = updateJobPost(id, {
    title: body.title,
    companyName: body.companyName,
    designation: body.designation,
    description: body.description,
    pdfNotice: body.pdfNotice,
    applicationDeadline: body.applicationDeadline,
    isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
  });
  return successResponse(job);
});

export const DELETE = withAuth(async (req, { user, params }) => {
  if (!["admin", "manager"].includes(user.role)) return errorResponse("Forbidden", 403);
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");
  deleteJobPost(id);
  return successResponse({ deleted: true });
});
