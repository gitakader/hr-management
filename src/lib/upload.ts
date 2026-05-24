import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";

export async function saveFile(
  file: File,
  subdir: string = "general"
): Promise<{ filename: string; filepath: string; mimetype: string; size: number }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = path.join(UPLOAD_DIR, subdir);

  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, uniqueName);
  await writeFile(fullPath, buffer);

  return {
    filename: file.name,
    filepath: `/uploads/${subdir}/${uniqueName}`,
    mimetype: file.type,
    size: buffer.length,
  };
}
