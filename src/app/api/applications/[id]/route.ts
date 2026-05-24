import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user, params }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      jobPost: true,
      user: {
        select: { id: true, fullName: true, mobileNumber: true, role: true },
        include: { profile: { include: { education: true, experience: true, training: true } } },
      },
      folders: true,
    },
  });

  if (!application) return errorResponse("Application not found", 404);
  if (user.role === "applicant" && application.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return successResponse(application);
});

export const PUT = withAuth(async (req, { user, params }) => {
  if (!["admin", "manager", "executive"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const body = await req.json();
  const { status, comment, approvalDate, shortlistDate, interviewDate, rejectionReason, employeeId, joiningDate } = body;

  const data: any = {};
  if (status) data.status = status;
  if (comment !== undefined) data.comment = comment;
  if (approvalDate) data.approvalDate = approvalDate;
  if (shortlistDate) data.shortlistDate = shortlistDate;
  if (interviewDate) data.interviewDate = interviewDate;
  if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;
  if (employeeId) data.employeeId = employeeId;
  if (joiningDate) data.joiningDate = joiningDate;

  const application = await prisma.application.update({
    where: { id },
    data,
    include: { jobPost: true, user: true },
  });

  // If selected, rename folder to employee ID
  if (status === "selected" && employeeId) {
    const folder = await prisma.folder.findFirst({
      where: { applicationId: application.id },
    });
    if (folder) {
      await prisma.folder.update({
        where: { id: folder.id },
        data: { name: employeeId },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: `Application ${status || "Updated"}`,
      details: `Application ${application.applicationId} status updated to ${status || "updated"}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: application.userId,
      title: "Application Status Updated",
      message: `Your application (${application.applicationId}) status: ${status || "updated"}`,
    },
  });

  return successResponse(application);
});
