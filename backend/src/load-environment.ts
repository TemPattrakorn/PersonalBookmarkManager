import { loadEnvFile } from "node:process";

export function loadEnvironment(): void {
  try {
    loadEnvFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
