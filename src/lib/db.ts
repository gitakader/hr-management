import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || path.join(process.cwd(), "prisma", "dev.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

// ==================== User ====================
export function findUserByMobile(mobileNumber: string): any {
  return getDb().prepare("SELECT * FROM User WHERE mobileNumber = ?").get(mobileNumber);
}

export function findUserById(id: number): any {
  return getDb().prepare("SELECT * FROM User WHERE id = ?").get(id);
}

export function findUserWithProfile(id: number): any {
  const user = getDb().prepare("SELECT * FROM User WHERE id = ?").get(id) as any;
  if (user) {
    user.profile = getDb().prepare("SELECT * FROM Profile WHERE userId = ?").get(id) || null;
  }
  return user;
}

export function createUser(fullName: string, mobileNumber: string, password: string, role: string = "applicant"): any {
  const now = new Date().toISOString();
  getDb().prepare("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run(fullName, mobileNumber, password, role, now, now);
  return findUserByMobile(mobileNumber);
}

export function updateUser(id: number, data: Record<string, any>): void {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  getDb().prepare(`UPDATE User SET ${sets} WHERE id = ?`).run(...values, id);
}

export function deleteUser(id: number): void {
  getDb().prepare("DELETE FROM User WHERE id = ?").run(id);
}

export function getAllUsers(): any[] {
  return getDb().prepare(`
    SELECT u.id, u.fullName, u.mobileNumber, u.role, u.isActive, u.createdAt,
      p.isProfileComplete,
      (SELECT COUNT(*) FROM Application WHERE userId = u.id) as applicationCount
    FROM User u LEFT JOIN Profile p ON p.userId = u.id ORDER BY u.createdAt DESC
  `).all();
}

// ==================== Profile ====================
export function findProfileByUserId(userId: number): any {
  return getDb().prepare("SELECT * FROM Profile WHERE userId = ?").get(userId);
}

export function upsertProfile(userId: number, data: Record<string, any>): void {
  const existing = findProfileByUserId(userId);
  if (existing) {
    const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const values = Object.values(data);
    getDb().prepare(`UPDATE Profile SET ${sets} WHERE userId = ?`).run(...values, userId);
  } else {
    const keys = ["userId", ...Object.keys(data)];
    const placeholders = keys.map(() => "?").join(", ");
    const values = [userId, ...Object.values(data)];
    const pnow = new Date().toISOString();
    getDb().prepare(`INSERT INTO Profile (${["userId", ...Object.keys(data), "createdAt", "updatedAt"].join(", ")}) VALUES (${["userId", ...Object.keys(data)].map(() => "?").join(", ")}, ?, ?)`).run(...values, pnow, pnow);
  }
}

// ==================== Education ====================
export function getEducationByProfileId(profileId: number): any[] {
  return getDb().prepare("SELECT * FROM Education WHERE profileId = ?").all(profileId);
}

export function createEducation(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const result = getDb().prepare(`INSERT INTO Education (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);
  return getDb().prepare("SELECT * FROM Education WHERE id = ?").get(result.lastInsertRowid);
}

export function deleteEducation(id: number): void {
  getDb().prepare("DELETE FROM Education WHERE id = ?").run(id);
}

// ==================== Experience ====================
export function getExperienceByProfileId(profileId: number): any[] {
  return getDb().prepare("SELECT * FROM Experience WHERE profileId = ?").all(profileId);
}

export function createExperience(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const result = getDb().prepare(`INSERT INTO Experience (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);
  return getDb().prepare("SELECT * FROM Experience WHERE id = ?").get(result.lastInsertRowid);
}

export function deleteExperience(id: number): void {
  getDb().prepare("DELETE FROM Experience WHERE id = ?").run(id);
}

// ==================== Training ====================
export function getTrainingByProfileId(profileId: number): any[] {
  return getDb().prepare("SELECT * FROM Training WHERE profileId = ?").all(profileId);
}

export function createTraining(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const result = getDb().prepare(`INSERT INTO Training (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);
  return getDb().prepare("SELECT * FROM Training WHERE id = ?").get(result.lastInsertRowid);
}

export function deleteTraining(id: number): void {
  getDb().prepare("DELETE FROM Training WHERE id = ?").run(id);
}

// ==================== JobPost ====================
export function getJobPosts(search?: string, company?: string, designation?: string): any[] {
  let sql = "SELECT jp.*, (SELECT COUNT(*) FROM Application WHERE jobPostId = jp.id) as applicationCount FROM JobPost jp WHERE 1=1";
  const params: any[] = [];
  if (search) { sql += " AND jp.title LIKE ?"; params.push(`%${search}%`); }
  if (company) { sql += " AND jp.companyName LIKE ?"; params.push(`%${company}%`); }
  if (designation) { sql += " AND jp.designation LIKE ?"; params.push(`%${designation}%`); }
  sql += " ORDER BY jp.createdAt DESC";
  return getDb().prepare(sql).all(...params);
}

export function getJobPostById(id: number): any {
  return getDb().prepare("SELECT jp.*, (SELECT COUNT(*) FROM Application WHERE jobPostId = jp.id) as applicationCount FROM JobPost jp WHERE jp.id = ?").get(id);
}

export function createJobPost(data: Record<string, any>): any {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const jnow = new Date().toISOString();
  const result = getDb().prepare(`INSERT INTO JobPost (${["createdAt", "updatedAt", ...Object.keys(data)].join(", ")}) VALUES (?, ?, ${placeholders})`).run(jnow, jnow, ...values);
  return getDb().prepare("SELECT * FROM JobPost WHERE id = ?").get(result.lastInsertRowid);
}

export function updateJobPost(id: number, data: Record<string, any>): any {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  getDb().prepare(`UPDATE JobPost SET ${sets} WHERE id = ?`).run(...values, id);
  return getDb().prepare("SELECT * FROM JobPost WHERE id = ?").get(id);
}

export function deleteJobPost(id: number): void {
  getDb().prepare("DELETE FROM JobPost WHERE id = ?").run(id);
}

// ==================== Application ====================
export function getApplications(status?: string, userId?: number): any[] {
  let sql = `SELECT a.*, 
    json_object('id', jp.id, 'title', jp.title, 'companyName', jp.companyName, 'designation', jp.designation) as jobPost,
    json_object('id', u.id, 'fullName', u.fullName, 'mobileNumber', u.mobileNumber, 'role', u.role) as user
  FROM Application a JOIN JobPost jp ON jp.id = a.jobPostId JOIN User u ON u.id = a.userId WHERE 1=1`;
  const params: any[] = [];
  if (userId) { sql += " AND a.userId = ?"; params.push(userId); }
  if (status && ["pending","approved","rejected","shortlisted","interview","selected"].includes(status)) {
    sql += " AND a.status = ?"; params.push(status);
  }
  sql += " ORDER BY a.createdAt DESC";
  return getDb().prepare(sql).all(...params);
}

export function getApplicationById(id: number): any {
  const app = getDb().prepare(`SELECT a.*,
    json_object('id', jp.id, 'title', jp.title, 'companyName', jp.companyName, 'designation', jp.designation) as jobPost,
    json_object('id', u.id, 'fullName', u.fullName, 'mobileNumber', u.mobileNumber, 'role', u.role) as user
  FROM Application a JOIN JobPost jp ON jp.id = a.jobPostId JOIN User u ON u.id = a.userId WHERE a.id = ?`).get(id) as any;
  if (app) {
    try { app.jobPost = JSON.parse(app.jobPost); } catch {}
    try { app.user = JSON.parse(app.user); } catch {}
  }
  return app;
}

export function findApplicationByUserAndJob(userId: number, jobPostId: number): any {
  return getDb().prepare("SELECT * FROM Application WHERE userId = ? AND jobPostId = ?").get(userId, jobPostId);
}

export function createApplication(data: Record<string, any>): any {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const anow = new Date().toISOString();
  const result = getDb().prepare(`INSERT INTO Application (${["createdAt", "updatedAt", ...Object.keys(data)].join(", ")}) VALUES (?, ?, ${placeholders})`).run(anow, anow, ...values);
  return getDb().prepare("SELECT * FROM Application WHERE id = ?").get(result.lastInsertRowid);
}

export function updateApplication(id: number, data: Record<string, any>): any {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  getDb().prepare(`UPDATE Application SET ${sets} WHERE id = ?`).run(...values, id);
  return getDb().prepare("SELECT * FROM Application WHERE id = ?").get(id);
}

// ==================== Document ====================
export function createDocument(data: Record<string, any>): any {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const result = getDb().prepare(`INSERT INTO Document (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);
  return getDb().prepare("SELECT * FROM Document WHERE id = ?").get(result.lastInsertRowid);
}

export function getDocumentsByUserId(userId: number): any[] {
  return getDb().prepare("SELECT * FROM Document WHERE userId = ? ORDER BY createdAt DESC").all(userId);
}

// ==================== Folder ====================
export function getFolders(parentId: number | null, applicationId?: number | null): any[] {
  let sql = "SELECT * FROM Folder WHERE 1=1";
  const params: any[] = [];
  if (parentId === null) sql += " AND parentId IS NULL";
  else { sql += " AND parentId = ?"; params.push(parentId); }
  if (applicationId !== undefined && applicationId !== null) {
    sql += " AND applicationId = ?"; params.push(applicationId);
  }
  sql += " ORDER BY isFile ASC, name ASC";
  return getDb().prepare(sql).all(...params);
}

export function createFolder(data: Record<string, any>): any {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const result = getDb().prepare(`INSERT INTO Folder (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);
  return getDb().prepare("SELECT * FROM Folder WHERE id = ?").get(result.lastInsertRowid);
}

export function findFolderByApplicationId(applicationId: number): any {
  return getDb().prepare("SELECT * FROM Folder WHERE applicationId = ?").get(applicationId);
}

export function updateFolder(id: number, data: Record<string, any>): void {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  getDb().prepare(`UPDATE Folder SET ${sets} WHERE id = ?`).run(...values, id);
}

// ==================== Permission ====================
export function upsertPermission(name: string, description: string): any {
  const existing = getDb().prepare("SELECT * FROM Permission WHERE name = ?").get(name);
  if (existing) return existing;
  getDb().prepare("INSERT INTO Permission (name, description) VALUES (?, ?)").run(name, description);
  return getDb().prepare("SELECT * FROM Permission WHERE name = ?").get(name);
}

export function getAllPermissions(): any[] {
  return getDb().prepare(`SELECT p.* FROM Permission p`).all();
}

export function upsertPermissionAssignment(userId: number, permissionId: number, granted: boolean): void {
  const existing = getDb().prepare("SELECT * FROM PermissionAssignment WHERE userId = ? AND permissionId = ?").get(userId, permissionId) as any;
  if (existing) {
    getDb().prepare("UPDATE PermissionAssignment SET granted = ? WHERE id = ?").run(granted ? 1 : 0, existing.id);
  } else {
    getDb().prepare("INSERT INTO PermissionAssignment (userId, permissionId, granted) VALUES (?, ?, ?)").run(userId, permissionId, granted ? 1 : 0);
  }
}

// ==================== ActivityLog ====================
export function createActivityLog(userId: number, action: string, details: string = ""): void {
  getDb().prepare("INSERT INTO ActivityLog (userId, action, details) VALUES (?, ?, ?)").run(userId, action, details);
}

export function getActivityLogs(userId?: number, limit: number = 100): any[] {
  let sql = "SELECT al.*, u.fullName, u.role FROM ActivityLog al JOIN User u ON u.id = al.userId";
  const params: any[] = [];
  if (userId) { sql += " WHERE al.userId = ?"; params.push(userId); }
  sql += " ORDER BY al.createdAt DESC LIMIT ?"; params.push(limit);
  return getDb().prepare(sql).all(...params);
}

// ==================== Notification ====================
export function createNotification(userId: number, title: string, message: string): void {
  getDb().prepare("INSERT INTO Notification (userId, title, message) VALUES (?, ?, ?)").run(userId, title, message);
}

export function getNotificationsByUserId(userId: number, limit: number = 50): any[] {
  return getDb().prepare("SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT ?").all(userId, limit);
}

export function markNotificationRead(id: number): void {
  getDb().prepare("UPDATE Notification SET isRead = 1 WHERE id = ?").run(id);
}

export function markAllNotificationsRead(userId: number): void {
  getDb().prepare("UPDATE Notification SET isRead = 1 WHERE userId = ?").run(userId);
}

// ==================== Helpers ====================
export function getProfileWithRelations(userId: number): any {
  const profile = getDb().prepare("SELECT * FROM Profile WHERE userId = ?").get(userId) as any;
  if (!profile) return null;
  profile.education = getDb().prepare("SELECT * FROM Education WHERE profileId = ?").all(profile.id);
  profile.experience = getDb().prepare("SELECT * FROM Experience WHERE profileId = ?").all(profile.id);
  profile.training = getDb().prepare("SELECT * FROM Training WHERE profileId = ?").all(profile.id);
  return profile;
}

export function getApplicationWithDetails(id: number): any {
  const app = getApplicationById(id);
  if (!app) return null;
  if (app.user?.role === "applicant") {
    const profile = getProfileWithRelations(app.user.id);
    if (profile) app.user.profile = profile;
  }
  app.folders = getDb().prepare("SELECT * FROM Folder WHERE applicationId = ?").all(id);
  return app;
}

export function count(table: string, where: string = "1=1", params: any[] = []): number {
  return (getDb().prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${where}`).get(...params) as any).count;
}

export function closeDb(): void {
  if (db) db.close();
}
