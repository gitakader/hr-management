import { NextRequest } from "next/server";
import { withAuth, successResponse } from "@/lib/middleware";
import { getNotificationsByUserId, markNotificationRead, markAllNotificationsRead } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const notifications = getNotificationsByUserId(user.id);
  return successResponse(notifications);
});

export const PUT = withAuth(async (req, { user }) => {
  const { id } = await req.json();
  if (id) {
    markNotificationRead(id);
  } else {
    markAllNotificationsRead(user.id);
  }
  return successResponse({ updated: true });
});
