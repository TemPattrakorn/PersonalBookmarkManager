import {
  createAuth0Client,
  type Auth0Client,
  type Auth0ClientOptions,
} from "@auth0/auth0-spa-js";

export const AUTH0_CALLBACK_URL = "http://localhost:3000/callback";
export const AUTH0_LOGOUT_URL = "http://localhost:3000";

export const auth0Options = {
  domain: "dev-yg.us.auth0.com",
  clientId: "H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA",
  cacheLocation: "memory",
  authorizationParams: {
    audience: "https://bbl-candidate-test-api",
    redirect_uri: AUTH0_CALLBACK_URL,
    scope: "openid profile email",
  },
} satisfies Auth0ClientOptions;

let clientPromise: Promise<Auth0Client> | undefined;

export function getAuthClient(): Promise<Auth0Client> {
  clientPromise ??= createAuth0Client(auth0Options);
  return clientPromise;
}

export async function startLogin(): Promise<void> {
  const client = await getAuthClient();
  await client.loginWithRedirect({
    authorizationParams: { redirect_uri: AUTH0_CALLBACK_URL },
  });
}

export async function completeLogin(): Promise<void> {
  const client = await getAuthClient();
  await client.handleRedirectCallback();
}

export async function signOut(): Promise<void> {
  const client = await getAuthClient();
  await client.logout({ logoutParams: { returnTo: AUTH0_LOGOUT_URL } });
}
