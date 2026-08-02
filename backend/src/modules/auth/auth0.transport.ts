import { Inject, Injectable } from "@nestjs/common";
import type { JWTVerifyGetKey } from "jose";
import {
  AUTH_CONFIG,
  type AuthConfig,
  AuthenticationRequiredError,
  Auth0UnavailableError,
} from "./auth.contract";
import { getJose } from "./jose.loader";

export type AuthMetadata = {
  getKey: JWTVerifyGetKey;
  userinfoUrl: string;
};

export type Auth0Profile = {
  email: string;
  emailVerified: boolean;
  subject: string;
};

@Injectable()
export class Auth0Transport {
  private metadataPromise?: Promise<AuthMetadata>;

  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  getMetadata(): Promise<AuthMetadata> {
    if (!this.metadataPromise) {
      const attempt = this.loadMetadata();
      this.metadataPromise = attempt;
      void attempt.catch(() => {
        if (this.metadataPromise === attempt) {
          this.metadataPromise = undefined;
        }
      });
    }
    return this.metadataPromise;
  }

  async getUserProfile(userinfoUrl: string, token: string): Promise<Auth0Profile> {
    const response = await this.fetchAuth0(userinfoUrl, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 429 || response.status >= 500) {
      throw new Auth0UnavailableError();
    }
    if (response.status >= 400) {
      throw new AuthenticationRequiredError();
    }
    if (!response.ok) {
      throw new Auth0UnavailableError();
    }

    const profile = await this.readJson(response);
    if (!isRecord(profile)) {
      throw new Auth0UnavailableError();
    }
    if (!("sub" in profile) || !("email" in profile) || !("email_verified" in profile)) {
      throw new AuthenticationRequiredError();
    }
    if (
      typeof profile.sub !== "string" ||
      typeof profile.email !== "string" ||
      typeof profile.email_verified !== "boolean"
    ) {
      throw new Auth0UnavailableError();
    }

    return {
      subject: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified,
    };
  }

  private async loadMetadata(): Promise<AuthMetadata> {
    const { createRemoteJWKSet, customFetch } = await getJose();
    const response = await this.fetchAuth0(this.config.discoveryUrl, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Auth0UnavailableError();
    }

    const metadata = await this.readJson(response);
    if (
      !isRecord(metadata) ||
      metadata.issuer !== this.config.issuer ||
      typeof metadata.jwks_uri !== "string" ||
      typeof metadata.userinfo_endpoint !== "string"
    ) {
      throw new Auth0UnavailableError();
    }

    const jwksUrl = this.readTrustedEndpoint(metadata.jwks_uri);
    const userinfoUrl = this.readTrustedEndpoint(metadata.userinfo_endpoint);
    const getKey = createRemoteJWKSet(jwksUrl, {
      timeoutDuration: this.config.timeoutMs,
      [customFetch]: async (
        input: string | URL | Request,
        init?: RequestInit,
      ) => {
        const jwksResponse = await this.fetchAuth0(input, init);
        if (!jwksResponse.ok) {
          throw new Auth0UnavailableError();
        }
        const jwks = await this.readJson(jwksResponse.clone());
        if (
          !isRecord(jwks) ||
          !Array.isArray(jwks.keys) ||
          !jwks.keys.every(isRecord)
        ) {
          throw new Auth0UnavailableError();
        }
        return jwksResponse;
      },
    });

    return { getKey, userinfoUrl: userinfoUrl.href };
  }

  private readTrustedEndpoint(value: string): URL {
    try {
      const endpoint = new URL(value);
      const issuer = new URL(this.config.issuer);
      if (endpoint.origin !== issuer.origin || endpoint.protocol !== issuer.protocol) {
        throw new Auth0UnavailableError();
      }
      return endpoint;
    } catch (error) {
      if (error instanceof Auth0UnavailableError) {
        throw error;
      }
      throw new Auth0UnavailableError();
    }
  }

  private async fetchAuth0(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      return await fetch(input, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch {
      throw new Auth0UnavailableError();
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new Auth0UnavailableError();
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
