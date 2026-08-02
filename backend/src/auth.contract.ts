export const AUTH_CONFIG = Symbol("AUTH_CONFIG");

export type AuthConfig = {
  audience: string;
  discoveryUrl: string;
  issuer: string;
  timeoutMs: number;
};

export const authConfig: AuthConfig = Object.freeze({
  audience: "https://bbl-candidate-test-api",
  discoveryUrl:
    "https://dev-yg.us.auth0.com/.well-known/openid-configuration",
  issuer: "https://dev-yg.us.auth0.com/",
  timeoutMs: 5_000,
});

export type Auth0Identity = {
  email: string;
  emailVerified: boolean;
  expiresAt: number;
  subject: string;
};

export class AuthenticationRequiredError extends Error {}
export class Auth0UnavailableError extends Error {}
