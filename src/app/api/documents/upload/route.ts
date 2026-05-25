import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { saveFile } from "@/lib/upload";
import { createDocument } from "@/lib/db";

export const POST = withAuth(async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "general";

    if (!file) return errorResponse("No file provided");

    const saved = await saveFile(file, `user_${user.id}/${category}`);

    const doc = createDocument({
      userId: user.id,
      filename: saved.filename,
      filepath: saved.filepath,
      mimetype: saved.mimetype,
      size: saved.size,
      category,
    });

    return successResponse(doc, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse("Upload failed", 500);
  }
});
