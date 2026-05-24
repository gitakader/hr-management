import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return successResponse(notifications);
});

export const PUT = withAuth(async (req, { user }) => {
  const { id } = await req.json();
  if (id) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } });
  }
  return successResponse({ updated: true });
});
