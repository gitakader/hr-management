import initSqlJs, { Database as SqlDatabase, SqlJsStatic } from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || path.join(process.cwd(), "dev.db");

let SQL: SqlJsStatic;
let db: SqlDatabase;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (db) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    SQL = await initSqlJs();
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run("PRAGMA foreign_keys = ON");
  })();
  return initPromise;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDb(): SqlDatabase {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  return db;
}

// Run a query and return all results as objects
export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = getDb().prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Run a query and return first result as object
export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Run a write query (INSERT/UPDATE/DELETE) and return lastInsertRowid
export function queryRun(sql: string, params: any[] = []): number {
  const db = getDb();
  db.run(sql, params);
  saveDb();
  return Number(db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] || 0);
}

// ==================== User ====================
export function findUserByMobile(mobileNumber: string): any {
  return queryOne("SELECT * FROM User WHERE mobileNumber = ?", [mobileNumber]);
}

export function findUserById(id: number): any {
  return queryOne("SELECT * FROM User WHERE id = ?", [id]);
}

export function findUserWithProfile(id: number): any {
  const user = queryOne("SELECT * FROM User WHERE id = ?", [id]) as any;
  if (user) {
    user.profile = queryOne("SELECT * FROM Profile WHERE userId = ?", [id]) || null;
  }
  return user;
}

export function createUser(fullName: string, mobileNumber: string, password: string, role: string = "applicant"): any {
  const now = new Date().toISOString();
  queryRun("INSERT INTO User (fullName, mobileNumber, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [fullName, mobileNumber, password, role, now, now]);
  return findUserByMobile(mobileNumber);
}

export function updateUser(id: number, data: Record<string, any>): void {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  queryRun(`UPDATE User SET ${sets} WHERE id = ?`, [...values, id]);
}

export function deleteUser(id: number): void {
  queryRun("DELETE FROM User WHERE id = ?", [id]);
}

export function getAllUsers(): any[] {
  return queryAll(`SELECT u.id, u.fullName, u.mobileNumber, u.role, u.isActive, u.createdAt,
    p.isProfileComplete,
    (SELECT COUNT(*) FROM Application WHERE userId = u.id) as applicationCount
    FROM User u LEFT JOIN Profile p ON p.userId = u.id ORDER BY u.createdAt DESC`);
}

// ==================== Profile ====================
export function findProfileByUserId(userId: number): any {
  return queryOne("SELECT * FROM Profile WHERE userId = ?", [userId]);
}

export function upsertProfile(userId: number, data: Record<string, any>): void {
  const existing = findProfileByUserId(userId);
  const now = new Date().toISOString();
  if (existing) {
    const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const values = Object.values(data);
    queryRun(`UPDATE Profile SET ${sets} WHERE userId = ?`, [...values, userId]);
  } else {
    const keys = ["userId", ...Object.keys(data), "createdAt", "updatedAt"];
    const placeholders = keys.map(() => "?").join(", ");
    const values = [userId, ...Object.values(data), now, now];
    queryRun(`INSERT INTO Profile (${keys.join(", ")}) VALUES (${placeholders})`, values);
  }
}

// ==================== Education ====================
export function getEducationByProfileId(profileId: number): any[] {
  return queryAll("SELECT * FROM Education WHERE profileId = ?", [profileId]);
}

export function createEducation(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const id = queryRun(`INSERT INTO Education (${keys.join(", ")}) VALUES (${placeholders})`, values);
  return queryOne("SELECT * FROM Education WHERE id = ?", [id]);
}

export function deleteEducation(id: number): void {
  queryRun("DELETE FROM Education WHERE id = ?", [id]);
}

// ==================== Experience ====================
export function getExperienceByProfileId(profileId: number): any[] {
  return queryAll("SELECT * FROM Experience WHERE profileId = ?", [profileId]);
}

export function createExperience(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const id = queryRun(`INSERT INTO Experience (${keys.join(", ")}) VALUES (${placeholders})`, values);
  return queryOne("SELECT * FROM Experience WHERE id = ?", [id]);
}

export function deleteExperience(id: number): void {
  queryRun("DELETE FROM Experience WHERE id = ?", [id]);
}

// ==================== Training ====================
export function getTrainingByProfileId(profileId: number): any[] {
  return queryAll("SELECT * FROM Training WHERE profileId = ?", [profileId]);
}

export function createTraining(profileId: number, data: Record<string, any>): any {
  const keys = ["profileId", ...Object.keys(data)];
  const placeholders = keys.map(() => "?").join(", ");
  const values = [profileId, ...Object.values(data)];
  const id = queryRun(`INSERT INTO Training (${keys.join(", ")}) VALUES (${placeholders})`, values);
  return queryOne("SELECT * FROM Training WHERE id = ?", [id]);
}

export function deleteTraining(id: number): void {
  queryRun("DELETE FROM Training WHERE id = ?", [id]);
}

// ==================== JobPost ====================
export function getJobPosts(search?: string, company?: string, designation?: string): any[] {
  let sql = "SELECT jp.*, (SELECT COUNT(*) FROM Application WHERE jobPostId = jp.id) as applicationCount FROM JobPost jp WHERE 1=1";
  const params: any[] = [];
  if (search) { sql += " AND jp.title LIKE ?"; params.push(`%${search}%`); }
  if (company) { sql += " AND jp.companyName LIKE ?"; params.push(`%${company}%`); }
  if (designation) { sql += " AND jp.designation LIKE ?"; params.push(`%${designation}%`); }
  sql += " ORDER BY jp.createdAt DESC";
  return queryAll(sql, params);
}

export function getJobPostById(id: number): any {
  return queryOne("SELECT jp.*, (SELECT COUNT(*) FROM Application WHERE jobPostId = jp.id) as applicationCount FROM JobPost jp WHERE jp.id = ?", [id]);
}

export function createJobPost(data: Record<string, any>): any {
  const now = new Date().toISOString();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const id = queryRun(`INSERT INTO JobPost (createdAt, updatedAt, ${keys.join(", ")}) VALUES (?, ?, ${placeholders})`, [now, now, ...values]);
  return queryOne("SELECT * FROM JobPost WHERE id = ?", [id]);
}

export function updateJobPost(id: number, data: Record<string, any>): any {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  queryRun(`UPDATE JobPost SET ${sets} WHERE id = ?`, [...values, id]);
  return queryOne("SELECT * FROM JobPost WHERE id = ?", [id]);
}

export function deleteJobPost(id: number): void {
  queryRun("DELETE FROM JobPost WHERE id = ?", [id]);
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
  return queryAll(sql, params);
}

export function getApplicationById(id: number): any {
  const app = queryOne(`SELECT a.*,
    json_object('id', jp.id, 'title', jp.title, 'companyName', jp.companyName, 'designation', jp.designation) as jobPost,
    json_object('id', u.id, 'fullName', u.fullName, 'mobileNumber', u.mobileNumber, 'role', u.role) as user
  FROM Application a JOIN JobPost jp ON jp.id = a.jobPostId JOIN User u ON u.id = a.userId WHERE a.id = ?`, [id]) as any;
  if (app) {
    try { app.jobPost = JSON.parse(app.jobPost); } catch {}
    try { app.user = JSON.parse(app.user); } catch {}
  }
  return app;
}

export function findApplicationByUserAndJob(userId: number, jobPostId: number): any {
  return queryOne("SELECT * FROM Application WHERE userId = ? AND jobPostId = ?", [userId, jobPostId]);
}

export function createApplication(data: Record<string, any>): any {
  const now = new Date().toISOString();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const id = queryRun(`INSERT INTO Application (createdAt, updatedAt, ${keys.join(", ")}) VALUES (?, ?, ${placeholders})`, [now, now, ...values]);
  return queryOne("SELECT * FROM Application WHERE id = ?", [id]);
}

export function updateApplication(id: number, data: Record<string, any>): any {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  queryRun(`UPDATE Application SET ${sets} WHERE id = ?`, [...values, id]);
  return queryOne("SELECT * FROM Application WHERE id = ?", [id]);
}

// ==================== Document ====================
export function createDocument(data: Record<string, any>): any {
  const now = new Date().toISOString();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const id = queryRun(`INSERT INTO Document (createdAt, ${keys.join(", ")}) VALUES (?, ${placeholders})`, [now, ...values]);
  return queryOne("SELECT * FROM Document WHERE id = ?", [id]);
}

export function getDocumentsByUserId(userId: number): any[] {
  return queryAll("SELECT * FROM Document WHERE userId = ? ORDER BY createdAt DESC", [userId]);
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
  return queryAll(sql, params);
}

export function createFolder(data: Record<string, any>): any {
  const now = new Date().toISOString();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const values = Object.values(data);
  const id = queryRun(`INSERT INTO Folder (createdAt, ${keys.join(", ")}) VALUES (?, ${placeholders})`, [now, ...values]);
  return queryOne("SELECT * FROM Folder WHERE id = ?", [id]);
}

export function findFolderByApplicationId(applicationId: number): any {
  return queryOne("SELECT * FROM Folder WHERE applicationId = ?", [applicationId]);
}

export function updateFolder(id: number, data: Record<string, any>): void {
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const values = Object.values(data);
  queryRun(`UPDATE Folder SET ${sets} WHERE id = ?`, [...values, id]);
}

// ==================== Permission ====================
export function upsertPermission(name: string, description: string): any {
  const existing = queryOne("SELECT * FROM Permission WHERE name = ?", [name]);
  if (existing) return existing;
  queryRun("INSERT INTO Permission (name, description) VALUES (?, ?)", [name, description]);
  return queryOne("SELECT * FROM Permission WHERE name = ?", [name]);
}

export function getAllPermissions(): any[] {
  return queryAll("SELECT p.* FROM Permission p");
}

export function upsertPermissionAssignment(userId: number, permissionId: number, granted: boolean): void {
  const existing = queryOne("SELECT * FROM PermissionAssignment WHERE userId = ? AND permissionId = ?", [userId, permissionId]) as any;
  if (existing) {
    queryRun("UPDATE PermissionAssignment SET granted = ? WHERE id = ?", [granted ? 1 : 0, existing.id]);
  } else {
    queryRun("INSERT INTO PermissionAssignment (userId, permissionId, granted) VALUES (?, ?, ?)", [userId, permissionId, granted ? 1 : 0]);
  }
}

// ==================== ActivityLog ====================
export function createActivityLog(userId: number, action: string, details: string = ""): void {
  const now = new Date().toISOString();
  queryRun("INSERT INTO ActivityLog (userId, action, details, createdAt) VALUES (?, ?, ?, ?)", [userId, action, details, now]);
}

export function getActivityLogs(userId?: number, limit: number = 100): any[] {
  let sql = "SELECT al.*, u.fullName, u.role FROM ActivityLog al JOIN User u ON u.id = al.userId";
  const params: any[] = [];
  if (userId) { sql += " WHERE al.userId = ?"; params.push(userId); }
  sql += " ORDER BY al.createdAt DESC LIMIT ?"; params.push(limit);
  return queryAll(sql, params);
}

// ==================== Notification ====================
export function createNotification(userId: number, title: string, message: string): void {
  const now = new Date().toISOString();
  queryRun("INSERT INTO Notification (userId, title, message, createdAt) VALUES (?, ?, ?, ?)", [userId, title, message, now]);
}

export function getNotificationsByUserId(userId: number, limit: number = 50): any[] {
  return queryAll("SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT ?", [userId, limit]);
}

export function markNotificationRead(id: number): void {
  queryRun("UPDATE Notification SET isRead = 1 WHERE id = ?", [id]);
}

export function markAllNotificationsRead(userId: number): void {
  queryRun("UPDATE Notification SET isRead = 1 WHERE userId = ?", [userId]);
}

// ==================== Helpers ====================
export function getProfileWithRelations(userId: number): any {
  const profile = queryOne("SELECT * FROM Profile WHERE userId = ?", [userId]) as any;
  if (!profile) return null;
  profile.education = queryAll("SELECT * FROM Education WHERE profileId = ?", [profile.id]);
  profile.experience = queryAll("SELECT * FROM Experience WHERE profileId = ?", [profile.id]);
  profile.training = queryAll("SELECT * FROM Training WHERE profileId = ?", [profile.id]);
  return profile;
}

export function getApplicationWithDetails(id: number): any {
  const app = getApplicationById(id);
  if (!app) return null;
  if (app.user?.role === "applicant") {
    const profile = getProfileWithRelations(app.user.id);
    if (profile) app.user.profile = profile;
  }
  app.folders = queryAll("SELECT * FROM Folder WHERE applicationId = ?", [id]);
  return app;
}

export function count(table: string, where: string = "1=1", params: any[] = []): number {
  return (queryOne(`SELECT COUNT(*) as count FROM ${table} WHERE ${where}`, params) as any)?.count || 0;
}

export function closeDb(): void {
  if (db) { saveDb(); db.close(); }
}
