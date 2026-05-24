import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  return successResponse(fullUser);
});
