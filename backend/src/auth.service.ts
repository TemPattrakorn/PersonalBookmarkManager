import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Person } from "./generated/prisma/client";
import { Auth0Client } from "./auth0.client";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  private readonly inFlight = new Map<string, Promise<Person>>();

  constructor(
    private readonly auth0: Auth0Client,
    private readonly prisma: PrismaService,
  ) {}

  authenticate(authorization: string | undefined): Promise<Person> {
    if (!authorization) return this.synchronize(authorization);

    const key = createHash("sha256").update(authorization).digest("base64url");
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const attempt = this.synchronize(authorization);
    this.inFlight.set(key, attempt);
    const clear = () => {
      if (this.inFlight.get(key) === attempt) this.inFlight.delete(key);
    };
    void attempt.then(clear, clear);
    return attempt;
  }

  private async synchronize(authorization: string | undefined): Promise<Person> {
    const identity = await this.auth0.getIdentity(authorization);

    return this.prisma.person.upsert({
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
  }
}
