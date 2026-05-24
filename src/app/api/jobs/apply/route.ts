import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { generateApplicationId } from "@/lib/auth";

export const POST = withAuth(async (req, { user }) => {
  try {
    const { jobPostId } = await req.json();
    if (!jobPostId) return errorResponse("Job post ID required");

    const job = await prisma.jobPost.findUnique({ where: { id: jobPostId } });
    if (!job) return errorResponse("Job not found", 404);

    // Check if already applied
    const existing = await prisma.application.findFirst({
      where: { userId: user.id, jobPostId },
    });
    if (existing) return errorResponse("Already applied for this job");

    // Check profile completeness
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile?.isProfileComplete) {
      return errorResponse("Complete your profile before applying");
    }

    const applicationId = generateApplicationId();

    const application = await prisma.application.create({
      data: {
        applicationId,
        userId: user.id,
        jobPostId,
        status: "pending",
      },
    });

    // Create folder for this application
    await prisma.folder.create({
      data: { name: applicationId, applicationId: application.id, isFile: false },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "Job Applied", details: `Applied for ${job.title} at ${job.companyName}` },
    });

    await prisma.notification.create({
      data: { userId: user.id, title: "Application Submitted", message: `Your application (${applicationId}) has been submitted successfully.` },
    });

    return successResponse(application, 201);
  } catch (error) {
    console.error("Apply error:", error);
    return errorResponse("Failed to apply", 500);
  }
});
