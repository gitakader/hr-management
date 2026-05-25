import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { findProfileByUserId, getTrainingByProfileId, createTraining, deleteTraining, upsertProfile } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const profile = findProfileByUserId(user.id);
  if (!profile) return successResponse([]);
  return successResponse(getTrainingByProfileId(profile.id));
});

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    let profile = findProfileByUserId(user.id);
    if (!profile) {
      upsertProfile(user.id, { fullName: "" });
      profile = findProfileByUserId(user.id);
    }
    const tr = createTraining(profile.id, body);
    return successResponse(tr, 201);
  } catch (error) {
    return errorResponse("Failed to add training", 500);
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  const { id } = await req.json();
  if (!id) return errorResponse("Training ID required");
  deleteTraining(parseInt(id));
  return successResponse({ deleted: true });
});
