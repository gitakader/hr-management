import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";

export const GET = withAuth(async (req, { user }) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { education: true, experience: true, training: true },
  });
  return successResponse(profile || null);
});

export const PUT = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const {
      fullName, fathersName, mothersName,
      presentVillage, presentPostOffice, presentThana, presentDistrict,
      permanentVillage, permanentPostOffice, permanentThana, permanentDistrict,
      dateOfBirth, identityNumber, identityType,
      gender, nationality, religion, maritalStatus,
    } = body;

    const data: any = {
      fullName, fathersName, mothersName,
      presentVillage, presentPostOffice, presentThana, presentDistrict,
      permanentVillage, permanentPostOffice, permanentThana, permanentDistrict,
      dateOfBirth, identityNumber, identityType,
      gender, nationality, religion, maritalStatus,
      isProfileComplete: true,
    };

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "Profile Updated", details: "Applicant updated their profile" },
    });

    return successResponse(profile);
  } catch (error) {
    console.error("Profile update error:", error);
    return errorResponse("Failed to update profile", 500);
  }
});
