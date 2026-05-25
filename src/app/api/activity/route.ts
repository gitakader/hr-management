import { NextRequest } from "next/server";
import { withAuth, successResponse } from "@/lib/middleware";
import { getActivityLogs } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const activities = getActivityLogs(user.id, 100);
  return successResponse(activities);
});
