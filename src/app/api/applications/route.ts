import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  let where: any = {};

  if (user.role === "applicant") {
    where.userId = user.id;
  }

  if (status && ["pending", "approved", "rejected", "shortlisted", "interview", "selected"].includes(status)) {
    where.status = status;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      jobPost: true,
      user: { select: { id: true, fullName: true, mobileNumber: true, role: true } },
      _count: { select: { folders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(applications);
});
