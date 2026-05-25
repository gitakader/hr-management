import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { getApplicationWithDetails, updateApplication, findFolderByApplicationId, updateFolder, createActivityLog, createNotification } from "@/lib/db";

export const GET = withAuth(async (req, { user, params }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) return errorResponse("Invalid ID");

  const application = getApplicationWithDetails(id);
  if (!application) return errorResponse("Application not found", 404);
  if (user.role === "applicant" && application.user?.id !== user.id) {
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

  const data: Record<string, any> = {};
  if (status) data.status = status;
  if (comment !== undefined) data.comment = comment;
  if (approvalDate) data.approvalDate = approvalDate;
  if (shortlistDate) data.shortlistDate = shortlistDate;
  if (interviewDate) data.interviewDate = interviewDate;
  if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;
  if (employeeId) data.employeeId = employeeId;
  if (joiningDate) data.joiningDate = joiningDate;

  const application = updateApplication(id, data);

  // If selected, rename folder to employee ID
  if (status === "selected" && employeeId) {
    const folder = findFolderByApplicationId(id);
    if (folder) {
      updateFolder(folder.id, { name: employeeId });
    }
  }

  const app = getApplicationWithDetails(id);
  createActivityLog(user.id, `Application ${status || "Updated"}`, `Application ${application.applicationId} status updated to ${status || "updated"}`);
  createNotification(application.userId, "Application Status Updated", `Your application (${application.applicationId}) status: ${status || "updated"}`);

  return successResponse(app);
});
