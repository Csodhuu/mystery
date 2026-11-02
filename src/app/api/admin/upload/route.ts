import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { AppError } from "@/server/errors";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export const POST = route(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError("NO_FILE", "Файл сонгоно уу");
  const ext = TYPES[file.type];
  if (!ext) throw new AppError("BAD_TYPE", "PNG, JPG, WEBP, GIF зураг оруулна уу");
  if (file.size > 2 * 1024 * 1024) throw new AppError("TOO_BIG", "Зураг 2MB-аас бага байна");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
});
