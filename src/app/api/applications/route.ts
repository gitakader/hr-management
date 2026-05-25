import { NextRequest } from "next/server";
import { withAuth, successResponse } from "@/lib/middleware";
import { getApplications } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const applications = getApplications(
    ["admin", "manager", "executive"].includes(user.role) ? status : undefined,
    user.role === "applicant" ? user.id : undefined
  );

  return successResponse(applications);
});
