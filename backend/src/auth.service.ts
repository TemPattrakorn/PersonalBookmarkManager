import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Person } from "./generated/prisma/client";
import { Auth0Client } from "./auth0.client";
import { PrismaService } from "./core/database/prisma.service";

@Injectable()
export class AuthService {
  private readonly completed = new Map<string, SynchronizedPerson>();
  private readonly inFlight = new Map<string, Promise<SynchronizedPerson>>();

  constructor(
    private readonly auth0: Auth0Client,
    private readonly prisma: PrismaService,
  ) {}

  authenticate(authorization: string | undefined): Promise<Person> {
    if (!authorization) {
      return this.synchronize(authorization).then(({ person }) => person);
    }

    const key = createHash("sha256").update(authorization).digest("base64url");
    const completed = this.completed.get(key);
    if (completed) {
      if (completed.expiresAt > Date.now()) return Promise.resolve(completed.person);
      this.completed.delete(key);
    }

    const existing = this.inFlight.get(key);
    if (existing) return existing.then(({ person }) => person);

    const attempt = this.synchronize(authorization);
    this.inFlight.set(key, attempt);
    const clear = () => {
      if (this.inFlight.get(key) === attempt) this.inFlight.delete(key);
    };
    void attempt.then((result) => {
      clear();
      if (result.expiresAt <= Date.now()) return;
      this.completed.set(key, result);
      const expiry = setTimeout(() => {
        if (this.completed.get(key) === result) this.completed.delete(key);
      }, result.expiresAt - Date.now());
      expiry.unref();
    }, clear);
    return attempt.then(({ person }) => person);
  }

  private async synchronize(
    authorization: string | undefined,
  ): Promise<SynchronizedPerson> {
    const identity = await this.auth0.getIdentity(authorization);

    const person = await this.prisma.person.upsert({
      where: { auth0Subject: identity.subject },
      update: {
        email: identity.email,
        normalizedEmail: identity.email.toLowerCase(),
        emailVerified: identity.emailVerified,
      },
      create: {
        auth0Subject: identity.subject,
        email: identity.email,
        normalizedEmail: identity.email.toLowerCase(),
        emailVerified: identity.emailVerified,
      },
    });

    return { expiresAt: identity.expiresAt, person };
  }
}

type SynchronizedPerson = {
  expiresAt: number;
  person: Person;
};
