import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { findProfileByUserId, getExperienceByProfileId, createExperience, deleteExperience, upsertProfile } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const profile = findProfileByUserId(user.id);
  if (!profile) return successResponse([]);
  return successResponse(getExperienceByProfileId(profile.id));
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    let profile = findProfileByUserId(user.id);
    if (!profile) {
      upsertProfile(user.id, { fullName: "" });
      profile = findProfileByUserId(user.id);
    }
    const exp = createExperience(profile.id, body);
    return successResponse(exp, 201);
  } catch (error) {
    return errorResponse("Failed to add experience", 500);
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  const { id } = await req.json();
  if (!id) return errorResponse("Experience ID required");
  deleteExperience(parseInt(id));
  return successResponse({ deleted: true });
});
