import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return successResponse([]);
  const exp = await prisma.experience.findMany({ where: { profileId: profile.id } });
  return successResponse(exp);
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.profile.create({ data: { userId: user.id, fullName: "" } });
    }
    const exp = await prisma.experience.create({
      data: { profileId: profile.id, ...body },
    });
    return successResponse(exp, 201);
  } catch (error) {
    return errorResponse("Failed to add experience", 500);
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  const { id } = await req.json();
  if (!id) return errorResponse("Experience ID required");
  await prisma.experience.delete({ where: { id: parseInt(id) } });
  return successResponse({ deleted: true });
});
