import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { hashPassword } from "@/lib/auth";

export const GET = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fullName: true, mobileNumber: true, role: true, isActive: true, createdAt: true,
      profile: { select: { isProfileComplete: true } },
      _count: { select: { applications: true } },
    },
  });

  return successResponse(users);
});

export const POST = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  try {
    const { fullName, mobileNumber, password, role } = await req.json();

    if (!["manager", "executive"].includes(role)) {
      return errorResponse("Can only create Manager or Executive accounts");
    }

    const existing = await prisma.user.findUnique({ where: { mobileNumber } });
    if (existing) return errorResponse("Mobile number already exists");

    const newUser = await prisma.user.create({
      data: {
        fullName,
        mobileNumber,
        password: hashPassword(password),
        role,
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "User Created", details: `Created ${role} account: ${fullName}` },
    });

    return successResponse({ id: newUser.id, fullName: newUser.fullName, mobileNumber: newUser.mobileNumber, role: newUser.role }, 201);
  } catch (error) {
    return errorResponse("Failed to create user", 500);
  }
});
