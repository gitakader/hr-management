require("dotenv").config();
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || path.join(__dirname, "prisma", "dev.db");
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = new Date().toISOString();

function findUserByMobile(mobile) {
  return db.prepare("SELECT * FROM User WHERE mobileNumber = ?").get(mobile);
}

function createUser(fullName, mobileNumber, password, role) {
  db.prepare("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)")
    .run(fullName, mobileNumber, password, role, now, now);
  return findUserByMobile(mobileNumber);
}

console.log("Seeding database...");

const perms = ['read', 'write', 'edit', 'delete', 'approve', 'reject', 'shortlist', 'interview_access'];
for (const name of perms) {
  const existing = db.prepare("SELECT * FROM Permission WHERE name = ?").get(name);
  if (!existing) {
    db.prepare("INSERT INTO Permission (name, description) VALUES (?, ?)").run(name, "Can " + name);
  }
}

if (!findUserByMobile("01700000000")) {
  createUser("Super Admin", "01700000000", bcrypt.hashSync("admin123", 10), "admin");
  console.log("  Created admin");
}
if (!findUserByMobile("01700000001")) {
  createUser("Sample Manager", "01700000001", bcrypt.hashSync("manager123", 10), "manager");
  console.log("  Created manager");
}
if (!findUserByMobile("01700000002")) {
  createUser("Sample Executive", "01700000002", bcrypt.hashSync("executive123", 10), "executive");
  console.log("  Created executive");
}

const jobCount = db.prepare("SELECT COUNT(*) as c FROM JobPost").get().c;
if (jobCount === 0) {
  const admin = findUserByMobile("01700000000");
  if (admin) {
    const stmt = db.prepare("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run("Senior Software Engineer", "Tech Solutions Ltd", "Senior Software Engineer", "We need a Senior Software Engineer with 5+ years experience.", "2026-06-30", admin.id, now, now);
    stmt.run("HR Manager", "Global HR Corp", "Manager", "Experienced HR Manager needed.", "2026-07-15", admin.id, now, now);
    stmt.run("Junior Web Developer", "Digital Agency BD", "Junior Developer", "Fresh graduates encouraged.", "2026-06-20", admin.id, now, now);
    console.log("  Created sample jobs");
  }
}

db.close();
console.log("\n✅ Database seeded successfully!");
console.log("Demo accounts:");
console.log("  Admin:     01700000000 / admin123");
console.log("  Manager:   01700000001 / manager123");
console.log("  Executive: 01700000002 / executive123");
