import { Inject, Injectable } from "@nestjs/common";
import {
  AUTH_CONFIG,
  type Auth0Identity,
  type AuthConfig,
  AuthenticationRequiredError,
  Auth0UnavailableError,
} from "./auth.contract";
import type { AuthMetadata } from "./auth0.transport";
import { Auth0Transport } from "./auth0.transport";
import { getJose } from "./jose.loader";

@Injectable()
export class Auth0Client {
  constructor(
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
    private readonly transport: Auth0Transport,
  ) {}

  async getIdentity(authorization: string | undefined): Promise<Auth0Identity> {
    const token = this.readBearerToken(authorization);
    await this.precheckToken(token);
    const metadata = await this.transport.getMetadata();
    const { expiresAt, subject } = await this.verifyToken(token, metadata);
    const profile = await this.transport.getUserProfile(metadata.userinfoUrl, token);

    if (profile.subject !== subject) {
      throw new AuthenticationRequiredError();
    }

    const email = profile.email.trim();
    if (email.length === 0) {
      throw new AuthenticationRequiredError();
    }

    return { subject, email, emailVerified: profile.emailVerified, expiresAt };
  }

  private readBearerToken(authorization: string | undefined): string {
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match) {
      throw new AuthenticationRequiredError();
    }
    return match[1];
  }

  private async precheckToken(token: string): Promise<void> {
    try {
      const { decodeJwt, decodeProtectedHeader } = await getJose();
      const header = decodeProtectedHeader(token);
      const payload = decodeJwt(token);
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      const now = Math.floor(Date.now() / 1000);
      if (
        header.alg !== "RS256" ||
        payload.iss !== this.config.issuer ||
        !audiences.includes(this.config.audience) ||
        typeof payload.sub !== "string" ||
        payload.sub.length === 0 ||
        typeof payload.exp !== "number" ||
        payload.exp <= now ||
        (typeof payload.nbf === "number" && payload.nbf > now)
      ) {
        throw new AuthenticationRequiredError();
      }
    } catch {
      throw new AuthenticationRequiredError();
    }
  }

  private async verifyToken(
    token: string,
    metadata: AuthMetadata,
  ): Promise<{ expiresAt: number; subject: string }> {
    const jose = await getJose();
    try {
      const { payload } = await jose.jwtVerify(token, metadata.getKey, {
        algorithms: ["RS256"],
        audience: this.config.audience,
        issuer: this.config.issuer,
      });
      if (
        typeof payload.sub !== "string" ||
        payload.sub.length === 0 ||
        typeof payload.exp !== "number"
      ) {
        throw new AuthenticationRequiredError();
      }
      return { expiresAt: payload.exp * 1_000, subject: payload.sub };
    } catch (error) {
      if (error instanceof Auth0UnavailableError) {
        throw error;
      }
      if (
        error instanceof jose.errors.JWKSInvalid ||
        error instanceof jose.errors.JWKSTimeout
      ) {
        throw new Auth0UnavailableError();
      }
      throw new AuthenticationRequiredError();
    }
  }
}
