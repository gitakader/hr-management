import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { generateApplicationId } from "@/lib/auth";
import { getJobPostById, findApplicationByUserAndJob, findProfileByUserId, createApplication, createFolder, createActivityLog, createNotification, getDb } from "@/lib/db";

export const POST = withAuth(async (req, { user }) => {
  try {
    const { jobPostId } = await req.json();
    if (!jobPostId) return errorResponse("Job post ID required");

    const job = getJobPostById(parseInt(jobPostId));
    if (!job) return errorResponse("Job not found", 404);

    const existing = findApplicationByUserAndJob(user.id, parseInt(jobPostId));
    if (existing) return errorResponse("Already applied for this job");

    const profile = findProfileByUserId(user.id);
    if (!profile?.isProfileComplete) {
      return errorResponse("Complete your profile before applying");
    }

    const applicationId = generateApplicationId();
    const app = createApplication({
      applicationId,
      userId: user.id,
      jobPostId: parseInt(jobPostId),
      status: "pending",
    });

    createFolder({ name: applicationId, applicationId: app.id, isFile: false });
    createActivityLog(user.id, "Job Applied", `Applied for ${job.title} at ${job.companyName}`);
    createNotification(user.id, "Application Submitted", `Your application (${applicationId}) has been submitted successfully.`);

    return successResponse(app, 201);
  } catch (error) {
    console.error("Apply error:", error);
    return errorResponse("Failed to apply", 500);
  }
});
