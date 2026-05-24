import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return successResponse(documents);
});
