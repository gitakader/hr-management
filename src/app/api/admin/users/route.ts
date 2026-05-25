import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/lib/middleware";
import { hashPassword } from "@/lib/auth";
import { getAllUsers, findUserByMobile, createUser, createActivityLog } from "@/lib/db";

export const GET = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);
  const users = getAllUsers();
  return successResponse(users);
});

export const POST = withAuth(async (req, { user }) => {
  if (user.role !== "admin") return errorResponse("Forbidden", 403);

  try {
    const { fullName, mobileNumber, password, role } = await req.json();
    if (!["manager", "executive"].includes(role)) {
      return errorResponse("Can only create Manager or Executive accounts");
    }

    const existing = findUserByMobile(mobileNumber);
    if (existing) return errorResponse("Mobile number already exists");

    const newUser = createUser(fullName, mobileNumber, hashPassword(password), role);
    createActivityLog(user.id, "User Created", `Created ${role} account: ${fullName}`);

    return successResponse(newUser, 201);
  } catch (error) {
    return errorResponse("Failed to create user", 500);
  }
});
