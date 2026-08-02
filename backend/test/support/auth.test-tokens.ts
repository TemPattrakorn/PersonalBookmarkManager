import { getJose } from "../../src/modules/auth/jose.loader";

export type AuthTestKeys = {
  privateKey: CryptoKey;
  publicJwk: Record<string, unknown>;
  symmetricKey: CryptoKey;
};

export async function createAuthTestKeys(): Promise<AuthTestKeys> {
  const { exportJWK, generateKeyPair, generateSecret } = await getJose();
  const pair = await generateKeyPair("RS256");
  return {
    privateKey: pair.privateKey,
    symmetricKey: await generateSecret("HS256"),
    publicJwk: {
      ...(await exportJWK(pair.publicKey)),
      alg: "RS256",
      kid: "test-key",
      use: "sig",
    },
  };
}

export async function signTestToken(
  key: CryptoKey,
  issuer: string,
  overrides: {
    audience?: string;
    expirationTime?: number | string;
    subject?: string;
  } = {},
): Promise<string> {
  const { SignJWT } = await getJose();
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(issuer)
    .setAudience(overrides.audience ?? "https://bbl-candidate-test-api")
    .setSubject(overrides.subject ?? "auth0|owner")
    .setIssuedAt()
    .setExpirationTime(overrides.expirationTime ?? "5m")
    .sign(key);
}

export async function signUntrustedToken(issuer: string): Promise<string> {
  const { generateKeyPair } = await getJose();
  const pair = await generateKeyPair("RS256");
  return signTestToken(pair.privateKey, issuer);
}

export async function signWrongAlgorithmToken(
  key: CryptoKey,
  issuer: string,
): Promise<string> {
  const { SignJWT } = await getJose();
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience("https://bbl-candidate-test-api")
    .setSubject("auth0|owner")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
