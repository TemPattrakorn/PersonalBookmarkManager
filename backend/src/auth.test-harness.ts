import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { AppModule } from "./app.module";
import { AUTH_CONFIG, type AuthConfig } from "./auth.contract";
import type { Person } from "./generated/prisma/client";
import { PrismaService } from "./prisma.service";

type Reply = {
  body?: unknown;
  delayMs?: number;
  rawBody?: string;
  status?: number;
};

type Auth0State = {
  discovery: Reply;
  jwks: Reply;
  userinfo: Reply;
  userinfoAuthorization?: string;
  userinfoCalls: number;
};

type UpsertInput = {
  where: { auth0Subject: string };
  create: {
    auth0Subject: string;
    email: string;
    normalizedEmail: string;
    emailVerified: boolean;
  };
  update: {
    email: string;
    normalizedEmail: string;
    emailVerified: boolean;
  };
};

export type AuthHarness = {
  app: INestApplication;
  auth0Server: Server;
  baseUrl: string;
  issuer: string;
  people: Map<string, Person>;
  state: Auth0State;
  upsert: jest.Mock<Promise<Person>, [UpsertInput]>;
};

export async function startAuthHarness(
  jwk: Record<string, unknown>,
  timeoutMs = 500,
): Promise<AuthHarness> {
  const state: Auth0State = {
    discovery: {},
    jwks: {},
    userinfo: {
      body: {
        sub: "auth0|owner",
        email: "Owner@Example.com",
        email_verified: true,
      },
    },
    userinfoCalls: 0,
  };
  let issuer = "";
  const auth0Server = createServer((requestMessage, response) => {
    const path = requestMessage.url;
    if (path === "/.well-known/openid-configuration") {
      sendReply(response, state.discovery, {
        issuer,
        jwks_uri: `${issuer}jwks`,
        userinfo_endpoint: `${issuer}userinfo`,
      });
      return;
    }
    if (path === "/jwks") {
      sendReply(response, state.jwks, { keys: [jwk] });
      return;
    }
    if (path === "/userinfo") {
      state.userinfoCalls += 1;
      state.userinfoAuthorization = requestMessage.headers.authorization;
      sendReply(response, state.userinfo, state.userinfo.body);
      return;
    }
    sendReply(response, { status: 404 }, {});
  });
  issuer = `${await listen(auth0Server)}/`;

  const people = new Map<string, Person>();
  const upsert = jest.fn(
    async ({ where, create, update }: UpsertInput): Promise<Person> => {
      const existing = people.get(where.auth0Subject);
      const now = new Date("2026-08-02T00:00:00.000Z");
      const person: Person = existing
        ? { ...existing, ...update, updatedAt: now }
        : {
            id: `person-${people.size + 1}`,
            ...create,
            createdAt: now,
            updatedAt: now,
          };
      people.set(where.auth0Subject, person);
      return person;
    },
  );
  const config: AuthConfig = {
    audience: "https://bbl-candidate-test-api",
    discoveryUrl: `${issuer}.well-known/openid-configuration`,
    issuer,
    timeoutMs,
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_CONFIG)
    .useValue(config)
    .overrideProvider(PrismaService)
    .useValue({ person: { upsert } })
    .compile();
  const app = module.createNestApplication();
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;

  return {
    app,
    auth0Server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    issuer,
    people,
    state,
    upsert,
  };
}

export async function closeAuthHarness(harness: AuthHarness): Promise<void> {
  await harness.app.close();
  harness.auth0Server.closeAllConnections();
  if (harness.auth0Server.listening) {
    await new Promise<void>((resolve, reject) =>
      harness.auth0Server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

export async function request(
  baseUrl: string,
  path: string,
  authorization?: string,
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    headers: authorization ? { authorization } : undefined,
  });
}

function sendReply(
  response: import("node:http").ServerResponse,
  reply: Reply,
  defaultBody: unknown,
): void {
  const send = (): void => {
    response.statusCode = reply.status ?? 200;
    response.setHeader("content-type", "application/json");
    response.end(reply.rawBody ?? JSON.stringify(reply.body ?? defaultBody));
  };
  if (reply.delayMs) {
    setTimeout(send, reply.delayMs);
  } else {
    send();
  }
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}
