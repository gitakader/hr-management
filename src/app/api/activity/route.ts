import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const activities = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { fullName: true, role: true } } },
  });
  return successResponse(activities);
});
