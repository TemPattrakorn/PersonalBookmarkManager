import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname } from "node:path";
import { cwd, env, loadEnvFile } from "node:process";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

try {
  loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const url = env.DATABASE_URL ?? "file:./prisma/dev.db";
if (!url.startsWith("file:")) throw new Error("DATABASE_URL must be a SQLite file URL");

if (url !== "file::memory:") {
  const path = fileURLToPath(new URL(url.slice(5), pathToFileURL(`${cwd()}/`)));
  mkdirSync(dirname(path), { recursive: true });
  closeSync(openSync(path, "a"));
}
