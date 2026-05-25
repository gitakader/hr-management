import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { findProfileByUserId, upsertProfile, createActivityLog } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const profile = findProfileByUserId(user.id);
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

    upsertProfile(user.id, data);
    const profile = findProfileByUserId(user.id);
    createActivityLog(user.id, "Profile Updated", "Applicant updated their profile");

    return successResponse(profile);
  } catch (error) {
    console.error("Profile update error:", error);
    return errorResponse("Failed to update profile", 500);
  }
});
