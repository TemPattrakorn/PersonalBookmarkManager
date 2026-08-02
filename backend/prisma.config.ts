import { defineConfig } from "prisma/config";
import { loadEnvironment } from "./src/core/config/load-environment";

loadEnvironment();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
