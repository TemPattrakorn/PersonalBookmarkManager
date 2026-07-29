# Frontend agent rules

The repository-root `AGENTS.md` applies here. This file adds frontend-specific
rules only.

## Stack and scope

- Use React with Vite and TypeScript, React Router 8 or newer, and MUI 9 or
  newer. Do not introduce Next.js or competing router/UI frameworks.
- Use Auth0 Authorization Code flow with PKCE using S256. Never use implicit
  flow, expose secrets in the client, or log tokens.
- Use the provided public SPA configuration:
  - discovery: `https://dev-yg.us.auth0.com/.well-known/openid-configuration`;
  - client ID: `H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA`;
  - callback URL: `http://localhost:3000/callback`;
  - logout URL: `http://localhost:3000`;
  - scope: `openid profile email`;
  - API audience: `https://bbl-candidate-test-api`.
- Run the frontend on port 3000 locally so the registered callback and logout
  URLs match. These Auth0 values are public and may be committed directly.
- The supplied test login is `candidate@test.com`. Keep its real password out
  of tracked files and client bundles; use an ignored local or test-runner
  secret, never a `VITE_` variable. Commit only placeholder `.env.example`
  values and ensure real `.env` files are ignored.
- Follow `API_DESIGN.md` rather than guessing payloads, errors, filters, or
  authorization behavior.
- Keep the core UI to `/collections` and `/bookmarks` with the approved list,
  detail, create, delete, and collection-filter interactions.
- Do not build sharing UI, `/all`, or full-text search until explicitly
  approved under the root scope rules.

## Privacy and behavior

- Treat backend authorization as authoritative; client-side route guards and
  hidden controls are user experience, not security boundaries.
- Never send a person/owner ID to establish ownership.
- Do not expose tokens, private API data, or diagnostic details through URLs,
  browser logs, or user-facing errors.
- Handle authentication expiry and API failures according to the approved
  contract without revealing cross-user resource existence.
- Preserve accessibility basics: semantic controls, labels, keyboard access,
  focus behavior, and understandable loading/error states.

Reuse existing components, MUI, browser features, and router features before
adding components, state libraries, API wrappers, or dependencies. Test the
smallest meaningful interaction, then run the applicable full test, lint,
typecheck, and build commands before handoff.
