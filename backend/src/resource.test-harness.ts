import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";
import {
  closeAuthHarness,
  request,
  startAuthHarness,
  type AuthHarness,
} from "./auth.test-harness";

export type Actor = {
  email: string;
  emailVerified: boolean;
  subject: string;
  token: string;
};

export type ResourceHarness = AuthHarness & {
  directory: string;
  prisma: PrismaClient;
};

export async function startResourceHarness(
  jwk: Record<string, unknown>,
): Promise<ResourceHarness> {
  const directory = await mkdtemp(join(tmpdir(), "bookmark-manager-"));
  const databasePath = join(directory, "resources.db");
  const database = new DatabaseSync(databasePath);
  database.exec(
    await readFile(
      join(__dirname, "../prisma/migrations/20260802093000_init/migration.sql"),
      "utf8",
    ),
  );
  database.close();

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: `file:${databasePath}` }),
  });
  const auth = await startAuthHarness(jwk, 500, prisma);
  return { ...auth, directory, prisma };
}

export async function closeResourceHarness(harness: ResourceHarness): Promise<void> {
  await closeAuthHarness(harness);
  await harness.prisma.$disconnect();
  await rm(harness.directory, { force: true, recursive: true });
}

export async function requestAs(
  harness: ResourceHarness,
  actor: Actor,
  path: string,
  options: { body?: unknown; contentType?: string; method?: string } = {},
): Promise<Response> {
  harness.state.userinfo.body = {
    sub: actor.subject,
    email: actor.email,
    email_verified: actor.emailVerified,
  };
  return request(harness.baseUrl, path, `Bearer ${actor.token}`, {
    method: options.method,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    contentType: options.contentType,
  });
}
