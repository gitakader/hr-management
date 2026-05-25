import { withAuth, successResponse } from "@/lib/middleware";
import { findUserWithProfile } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const fullUser = findUserWithProfile(user.id);
  return successResponse(fullUser);
});
