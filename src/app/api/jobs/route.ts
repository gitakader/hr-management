import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { getJobPosts, createJobPost, createActivityLog } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const company = searchParams.get("company") || "";
  const designation = searchParams.get("designation") || "";

  const jobs = getJobPosts(search, company, designation);
  return successResponse(jobs);
});

export const POST = withAuth(async (req, { user }) => {
  try {
    if (!["admin", "manager"].includes(user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const job = createJobPost({
      title: body.title,
      companyName: body.companyName,
      designation: body.designation,
      description: body.description || "",
      pdfNotice: body.pdfNotice || "",
      applicationDeadline: body.applicationDeadline,
      createdById: user.id,
    });

    createActivityLog(user.id, "Job Post Created", `Created job: ${job.title}`);
    return successResponse(job, 201);
  } catch (error) {
    console.error("Job create error:", error);
    return errorResponse("Failed to create job post", 500);
  }
});
