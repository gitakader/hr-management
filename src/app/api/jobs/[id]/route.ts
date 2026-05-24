import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user, params }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) return errorResponse("Job not found", 404);
  return successResponse(job);
});

export const PUT = withAuth(async (req, { user, params }) => {
  if (!["admin", "manager"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const body = await req.json();
  const job = await prisma.jobPost.update({
    where: { id },
    data: {
      title: body.title,
      companyName: body.companyName,
      designation: body.designation,
      description: body.description,
      pdfNotice: body.pdfNotice,
      applicationDeadline: body.applicationDeadline,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
  });

  return successResponse(job);
});

export const DELETE = withAuth(async (req, { user, params }) => {
  if (!["admin", "manager"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  await prisma.jobPost.delete({ where: { id } });
  return successResponse({ deleted: true });
});
