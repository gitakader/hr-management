import { NextRequest } from "next/server";
import { withAuth, successResponse } from "@/lib/middleware";
import { getDocumentsByUserId } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  const documents = getDocumentsByUserId(user.id);
  return successResponse(documents);
});
