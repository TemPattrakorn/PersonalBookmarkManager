import { Injectable } from "@nestjs/common";
import type { Person } from "./generated/prisma/client";
import { Auth0Client } from "./auth0.client";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly auth0: Auth0Client,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(authorization: string | undefined): Promise<Person> {
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
