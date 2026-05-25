import { successResponse, errorResponse } from "@/lib/middleware";
import { hashPassword } from "@/lib/auth";
import { upsertPermission, findUserByMobile, createUser, initDb, count, queryRun } from "@/lib/db";

export async function GET() {
  try {
    await initDb();

    const permNames = ["read", "write", "edit", "delete", "approve", "reject", "shortlist", "interview_access"];
    for (const name of permNames) {
      upsertPermission(name, `Can ${name}`);
    }

    if (!findUserByMobile("01700000000")) {
      createUser("Super Admin", "01700000000", hashPassword("admin123"), "admin");
    }
    if (!findUserByMobile("01700000001")) {
      createUser("Sample Manager", "01700000001", hashPassword("manager123"), "manager");
    }
    if (!findUserByMobile("01700000002")) {
      createUser("Sample Executive", "01700000002", hashPassword("executive123"), "executive");
    }

    if (count("JobPost") === 0) {
      const admin = findUserByMobile("01700000000");
      if (admin) {
        const now = new Date().toISOString();
        queryRun("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ["Senior Software Engineer", "Tech Solutions Ltd", "Senior Software Engineer", "We need a Senior Software Engineer with 5+ years experience.", "2026-06-30", admin.id, now, now]);
        queryRun("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ["HR Manager", "Global HR Corp", "Manager", "Experienced HR Manager needed.", "2026-07-15", admin.id, now, now]);
        queryRun("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ["Junior Web Developer", "Digital Agency BD", "Junior Developer", "Fresh graduates encouraged.", "2026-06-20", admin.id, now, now]);
      }
    }

    return successResponse({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return errorResponse("Seed failed", 500);
  }
}
