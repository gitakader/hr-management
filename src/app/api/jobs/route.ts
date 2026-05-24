import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const company = searchParams.get("company") || "";
  const designation = searchParams.get("designation") || "";

  const where: any = { isActive: true };
  if (search) where.title = { contains: search };
  if (company) where.companyName = { contains: company };
  if (designation) where.designation = { contains: designation };

  const jobs = await prisma.jobPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return successResponse(jobs);
});

// Create job post (Admin/Manager only)
export const POST = withAuth(async (req, { user }) => {
  try {
    if (!["admin", "manager"].includes(user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const job = await prisma.jobPost.create({
      data: {
        title: body.title,
        companyName: body.companyName,
        designation: body.designation,
        description: body.description || "",
        pdfNotice: body.pdfNotice || "",
        applicationDeadline: body.applicationDeadline,
        createdById: user.id,
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "Job Post Created", details: `Created job: ${job.title}` },
    });

    return successResponse(job, 201);
  } catch (error) {
    console.error("Job create error:", error);
    return errorResponse("Failed to create job post", 500);
  }
});
