import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/middleware";

export async function GET() {
  try {
    // Create default permissions
    const permNames = [
      "read", "write", "edit", "delete", "approve", "reject", "shortlist", "interview_access"
    ];
    for (const name of permNames) {
      await prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: `Can ${name}` },
      });
    }

    // Create admin if not exists
    const existingAdmin = await prisma.user.findUnique({ where: { mobileNumber: "01700000000" } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          fullName: "Super Admin",
          mobileNumber: "01700000000",
          password: hashPassword("admin123"),
          role: "admin",
        },
      });
    }

    // Create sample manager
    const existingMgr = await prisma.user.findUnique({ where: { mobileNumber: "01700000001" } });
    if (!existingMgr) {
      await prisma.user.create({
        data: {
          fullName: "Sample Manager",
          mobileNumber: "01700000001",
          password: hashPassword("manager123"),
          role: "manager",
        },
      });
    }

    // Create sample executive
    const existingExec = await prisma.user.findUnique({ where: { mobileNumber: "01700000002" } });
    if (!existingExec) {
      await prisma.user.create({
        data: {
          fullName: "Sample Executive",
          mobileNumber: "01700000002",
          password: hashPassword("executive123"),
          role: "executive",
        },
      });
    }

    // Create sample job posts
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (admin) {
      const jobCount = await prisma.jobPost.count();
      if (jobCount === 0) {
        await prisma.jobPost.createMany({
          data: [
            {
              title: "Senior Software Engineer",
              companyName: "Tech Solutions Ltd",
              designation: "Senior Software Engineer",
              description: "We are looking for a Senior Software Engineer with 5+ years of experience.",
              applicationDeadline: "2026-06-30",
              createdById: admin.id,
            },
            {
              title: "HR Manager",
              companyName: "Global HR Corp",
              designation: "Manager",
              description: "Experienced HR Manager needed for our growing team.",
              applicationDeadline: "2026-07-15",
              createdById: admin.id,
            },
            {
              title: "Junior Web Developer",
              companyName: "Digital Agency BD",
              designation: "Junior Developer",
              description: "Fresh graduates are encouraged to apply.",
              applicationDeadline: "2026-06-20",
              createdById: admin.id,
            },
          ],
        });
      }
    }

    return successResponse({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return errorResponse("Seed failed", 500);
  }
}
