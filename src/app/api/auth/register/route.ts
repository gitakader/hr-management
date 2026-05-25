import { NextRequest } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/middleware";
import { findUserByMobile, createUser, createFolder, initDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { fullName, mobileNumber, password } = await req.json();
    if (!fullName || !mobileNumber || !password) {
      return errorResponse("All fields are required");
    }

    const existing = findUserByMobile(mobileNumber);
    if (existing) {
      return errorResponse("Mobile number already registered");
    }

    const hashedPassword = hashPassword(password);
    const user = createUser(fullName, mobileNumber, hashedPassword, "applicant");
    createFolder({ name: mobileNumber, isFile: false });

    const token = generateToken({ id: user.id as number, mobileNumber, role: "applicant" });

    return successResponse({ token, user }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Registration failed", 500);
  }
}
