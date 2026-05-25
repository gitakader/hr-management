import { NextRequest } from "next/server";
import { comparePassword, generateToken } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/middleware";
import { findUserByMobile } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, password } = await req.json();
    if (!mobileNumber || !password) {
      return errorResponse("Mobile number and password are required");
    }

    const user = findUserByMobile(mobileNumber);
    if (!user || !comparePassword(password, user.password)) {
      return errorResponse("Invalid credentials", 401);
    }

    if (!user.isActive) {
      return errorResponse("Account is deactivated", 403);
    }

    const token = generateToken({ id: user.id, mobileNumber: user.mobileNumber, role: user.role });

    return successResponse({
      token,
      user: { id: user.id, fullName: user.fullName, mobileNumber: user.mobileNumber, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed", 500);
  }
}
