import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateToken, generateApplicationId } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  try {
    const { fullName, mobileNumber, password } = await req.json();

    if (!fullName || !mobileNumber || !password) {
      return errorResponse("All fields are required");
    }

    const existing = await prisma.user.findUnique({ where: { mobileNumber } });
    if (existing) {
      return errorResponse("Mobile number already registered");
    }

    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: { fullName, mobileNumber, password: hashedPassword, role: "applicant" },
    });

    // Create initial folder for the user
    await prisma.folder.create({
      data: { name: mobileNumber, isFile: false },
    });

    const token = generateToken({ id: user.id, mobileNumber: user.mobileNumber, role: user.role });

    return successResponse({
      token,
      user: { id: user.id, fullName: user.fullName, mobileNumber: user.mobileNumber, role: user.role },
    }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Registration failed", 500);
  }
}
