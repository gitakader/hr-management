// Pre-seed: create database with schema and demo data using sql.js (no native deps)
const initSqlJs = require("sql.js");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || path.join(__dirname, "dev.db");

async function seed() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("PRAGMA foreign_keys = ON");

  const now = new Date().toISOString();

  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    mobileNumber TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'applicant',
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    fullName TEXT NOT NULL DEFAULT '',
    fathersName TEXT NOT NULL DEFAULT '',
    mothersName TEXT NOT NULL DEFAULT '',
    presentVillage TEXT NOT NULL DEFAULT '',
    presentPostOffice TEXT NOT NULL DEFAULT '',
    presentThana TEXT NOT NULL DEFAULT '',
    presentDistrict TEXT NOT NULL DEFAULT '',
    permanentVillage TEXT NOT NULL DEFAULT '',
    permanentPostOffice TEXT NOT NULL DEFAULT '',
    permanentThana TEXT NOT NULL DEFAULT '',
    permanentDistrict TEXT NOT NULL DEFAULT '',
    dateOfBirth TEXT NOT NULL DEFAULT '',
    identityNumber TEXT NOT NULL DEFAULT '',
    identityType TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    nationality TEXT NOT NULL DEFAULT 'Bangladeshi',
    religion TEXT NOT NULL DEFAULT '',
    maritalStatus TEXT NOT NULL DEFAULT '',
    signature TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    isProfileComplete INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    examName TEXT NOT NULL,
    groupDept TEXT NOT NULL DEFAULT '',
    gpaClass TEXT NOT NULL DEFAULT '',
    passingYear TEXT NOT NULL,
    board TEXT NOT NULL DEFAULT '',
    document TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    officeName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Training (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profileId INTEGER NOT NULL,
    trainingName TEXT NOT NULL,
    instituteName TEXT NOT NULL,
    additionalInfo TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS JobPost (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    companyName TEXT NOT NULL,
    designation TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    pdfNotice TEXT NOT NULL DEFAULT '',
    applicationDeadline TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdById INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (createdById) REFERENCES User(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Application (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicationId TEXT NOT NULL UNIQUE,
    userId INTEGER NOT NULL,
    jobPostId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    comment TEXT NOT NULL DEFAULT '',
    approvalDate TEXT NOT NULL DEFAULT '',
    shortlistDate TEXT NOT NULL DEFAULT '',
    interviewDate TEXT NOT NULL DEFAULT '',
    rejectionReason TEXT NOT NULL DEFAULT '',
    employeeId TEXT NOT NULL DEFAULT '',
    joiningDate TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (jobPostId) REFERENCES JobPost(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Document (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'general',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Folder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    applicationId INTEGER,
    parentId INTEGER,
    isFile INTEGER NOT NULL DEFAULT 0,
    filepath TEXT NOT NULL DEFAULT '',
    mimetype TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (applicationId) REFERENCES Application(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES Folder(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT ''
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS PermissionAssignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    permissionId INTEGER NOT NULL,
    granted INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES Permission(id) ON DELETE CASCADE,
    UNIQUE(userId, permissionId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ActivityLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`);

  console.log("Tables created.");

  // Seed data
  const perms = ['read', 'write', 'edit', 'delete', 'approve', 'reject', 'shortlist', 'interview_access'];
  for (const name of perms) {
    const exists = db.exec("SELECT id FROM Permission WHERE name = '" + name + "'");
    if (exists.length === 0 || exists[0].values.length === 0) {
      db.run("INSERT INTO Permission (name, description) VALUES (?, ?)", [name, "Can " + name]);
    }
  }

  const hash = bcrypt.hashSync("admin123", 10);
  const existingAdmin = db.exec("SELECT id FROM User WHERE mobileNumber = '01700000000'");
  if (existingAdmin.length === 0 || existingAdmin[0].values.length === 0) {
    db.run("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["Super Admin", "01700000000", hash, "admin", now, now]);
  }

  const existingMgr = db.exec("SELECT id FROM User WHERE mobileNumber = '01700000001'");
  if (existingMgr.length === 0 || existingMgr[0].values.length === 0) {
    db.run("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["Sample Manager", "01700000001", bcrypt.hashSync("manager123", 10), "manager", now, now]);
  }

  const existingExec = db.exec("SELECT id FROM User WHERE mobileNumber = '01700000002'");
  if (existingExec.length === 0 || existingExec[0].values.length === 0) {
    db.run("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["Sample Executive", "01700000002", bcrypt.hashSync("executive123", 10), "executive", now, now]);
  }

  const jobCount = db.exec("SELECT COUNT(*) as c FROM JobPost");
  if (jobCount[0]?.values[0]?.[0] === 0) {
    const admin = db.exec("SELECT id FROM User WHERE mobileNumber = '01700000000'");
    const adminId = admin[0]?.values[0]?.[0];
    if (adminId) {
      db.run("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ["Senior Software Engineer", "Tech Solutions Ltd", "Senior Software Engineer", "We need a Senior Software Engineer with 5+ years experience.", "2026-06-30", adminId, now, now]);
      db.run("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ["HR Manager", "Global HR Corp", "Manager", "Experienced HR Manager needed.", "2026-07-15", adminId, now, now]);
      db.run("INSERT INTO JobPost (title, companyName, designation, description, applicationDeadline, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ["Junior Web Developer", "Digital Agency BD", "Junior Developer", "Fresh graduates encouraged.", "2026-06-20", adminId, now, now]);
      console.log("  Created sample jobs");
    }
  }

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  db.close();

  console.log("\n✅ Database seeded successfully!");
  console.log("File:", DB_PATH);
  console.log("Demo accounts:");
  console.log("  Admin:     01700000000 / admin123");
  console.log("  Manager:   01700000001 / manager123");
  console.log("  Executive: 01700000002 / executive123");
}

seed().catch(e => { console.error("Seed failed:", e); process.exit(1); });
