# AI workflow

This is a factual working record through Phase 4.

## Tools and task decomposition

The work used Codex (GPT-5) for repository inspection, planning,
implementation, and review. Shell tools were used read-only first: `rg` found
repository instructions and relevant files, Git exposed the current diff, and
Node/npm/Prisma commands checked compatibility and behavior. File changes were
made with patch-based edits. Official Prisma and React Router documentation
was checked during planning for Prisma 7's generated-client/driver-adapter
requirements and React Router 8's package exports.

Work was divided into approved phases. Phase 0 settled the authentication,
privacy, deletion, update, persistence, pagination, validation, and sharing
contracts before runtime code existed. Phase 1 then stayed deliberately
smaller: npm workspace tooling, a Nest/Prisma foundation, the complete initial
schema and migration, a React/Router/MUI shell, smoke tests, documentation, and
one reusable verification command. Phase 2 added the first authenticated
vertical slice: global token verification, Auth0 profile synchronization,
local-person upsert, `GET /me`, normalized failures, and HTTP-level security
tests. Phase 3 completed the backend resource API with strict validation,
owner-or-grantee read queries, owner-only writes, atomic collection deletion,
and the approved collection-share lifecycle. Frontend authentication and
resource UI were then completed in Phase 4. The official Auth0 SPA SDK provides
Authorization Code with PKCE; the client holds its token only in memory, sends
it through one authenticated API client, and protects its routes. The UI adds
owned collection and bookmark CRUD before rendering the narrow sharing surface:
owner-managed exact-email grants and grantee emails, plus a separate read-only
shared-collection section with an idempotent leave action. The final structural
refactor placed feature pages, presentation components, hooks, and API calls in
their own frontend boundaries without adding dependencies.

Ponytail full mode was used to challenge unnecessary scaffolding. It led to a
single root lockfile and lint configuration, native npm workspaces, no
concurrent-process package, Node's native `.env` loading, one Prisma provider,
server-rendered frontend testing without jsdom or Testing Library, and a Phase
2 authentication path using one JWT dependency plus native `fetch` rather than
a repository layer or HTTP client.

## What worked

1. Contract-first review exposed privacy-sensitive ambiguities before code.
   The approved documents now define private-by-default ownership, the narrow
   read-only share exception, atomic collection cleanup, and non-disclosing
   errors.
2. Root workspace scripts provide one repeatable gate across Prisma, backend,
   and frontend work. Prisma client generation runs during install and backend
   builds, so generated code does not need to be tracked.
3. The Phase 2/3 HTTP suite uses local Auth0 discovery, JWKS, and `/userinfo`
   endpoints with generated RS256 tokens plus a temporary SQLite database
   created from the committed migration. It reproduces credential, profile,
   persistence, validation, authorization, sharing, and exact-response
   behavior without live Auth0 credentials.
4. Phase 4 kept sharing controls capability-safe: viewer data receives no
   owner controls, shared bookmark filters suppress mutation UI, and the server
   remains responsible for denying every unauthorized request.

## Failures and recoveries

1. Dependency installation exposed two stale patch selections: React 19.2.4
   did not satisfy React Router 8.3, and npm 10.9.4 hit an internal `edgesOut`
   error while resolving Vitest 4.1.0's current peers. Pinning the verified
   React 19.2.8 and Vitest 4.1.10 releases allowed a normal install; no force
   or legacy-peer flag was used. Registry tarball retries were noisy but
   recovered, and npm reported zero vulnerabilities.
2. Prisma CLI 7.9.1 returned a generic schema-engine error when asked to create
   an absent SQLite file. Schema validation and migration diff proved the model
   was valid. A small standard-library preflight now creates only the configured
   SQLite file; Prisma still generates, applies, and records every migration.
3. Phase 2 verification exposed two integration assumptions. TypeScript first
   identified the missing Express request declarations, so the exact
   `@types/express` development package was added. Jest then tried to parse
   `jose` 6's ESM directly despite Node 22 supporting it from CommonJS. Native
   dynamic import plus Jest's VM-module flag preserved both the current `jose`
   release and the CommonJS application build. The sandbox initially blocked
   the test servers' local ports; the same tests passed with approved
   localhost-listen permission.
4. Phase 3's additional ESM-backed HTTP suites exposed Jest's isolated-module
   limit for the native dynamic `jose` import. One HTTP test entrypoint now
   loads those suites in a shared Jest environment; production authentication
   is unchanged. Node 22's built-in SQLite API initializes each temporary test
   database from the committed migration without a persistent test file.
5. An initial Phase 4 full check used the shell's Node 24 and made the
   real-Prisma resource harness return sanitized `500` responses during `/me`
   setup. A direct Node 22.22.0 reproduction and the configured E2E suite both
   passed, identifying the runtime mismatch rather than an application defect.
   The final verification explicitly selected the repository's required Node
   version; no backend behavior was changed to mask the failure.
6. Manual Phase 4 testing exposed a real concurrency and presentation problem:
   parallel same-token resource requests repeated `/userinfo` and person
   upserts, while a failed first list load rendered the same empty state as a
   successful empty response. The repair shares only an active same-header
   identity synchronization, removes it on either outcome, and records whether
   each frontend data source has loaded successfully so failures remain visible
   and retryable. An early verification invocation started npm with Node 22 but
   left lifecycle subprocesses on the shell's Node 24, reproducing the known
   real-Prisma harness `500`; explicitly selecting Node 22 for the whole gate
   passed without changing persistence or authorization behavior.
7. Live use showed that sharing only the active authentication promise was
   insufficient: after it settled, every reload again depended on `/userinfo`
   and the person upsert, so several manual retries could still be needed. The
   follow-up reuses only a successful result for the exact token and only until
   its verified expiry. Failed attempts remain uncached, different tokens stay
   isolated, and a focused expiry check proves an expired cached identity
   cannot authenticate.

## Prompt quality

The effective prompts were the approved phase plans: they named exact
versions, boundaries, artifacts, security behavior, and checks. Phase 2's
explicit 401/503 matrix made credential and outage behavior directly testable;
Phase 3's endpoint and privacy matrix kept read sharing from becoming mutation
or user-browsing access.

The initial broad request to start building from `AGENTS.md` was not precise
enough to authorize safe edits because deletion, sharing, validation, and API
semantics were unsettled. Converting it into explicit phases and presenting
defaults for approval was more effective than guessing.

## Review, checks, and cost awareness

The reusable `.agent/commands/verify.md` command was used before handoff. A
clean root `npm ci` initially could not update Prisma's user cache within the
workspace sandbox; the approved cache permission allowed the same command to
complete. Prisma validation and generation passed, the initial migration
applied to a fresh temporary database and reported up to date, and the final
root `npm run check` passed lint, both workspace typechecks, both smoke tests,
and both production builds under Node 22.22.0.

The first live starts were correctly blocked by the workspace sandbox's port
policy. With approved localhost-listen permission, Nest started on port 3001,
returned the expected controller-free `404` with CORS limited to the frontend
origin, and Vite served the shell on port 3000. Both processes were stopped
afterward. The final diff and ignored-artifact review is reported in the
handoff.

Phase 2 focused verification ran under Node 22.22.0. Backend typechecking and
all 17 backend tests passed; the HTTP tests required approved localhost-listen
permission. The final root `npm run check` then passed Prisma validation and
generation, lint, both workspace typechecks, all 18 tests, and both production
builds. The final diff and ignored-artifact inspection is reported in the
Phase 2 handoff.

Phase 3 focused resource and sharing tests passed against the temporary SQLite
database under Node 22.22.0; the HTTP tests again required approved
localhost-listen permission. The final root `npm run check` passed Prisma
validation and generation, lint, both workspace typechecks, all 25 tests, and
both production builds. The final diff and ignored-artifact inspection is
reported in the Phase 3 handoff.

Phase 4 used the same verification command under Node 22.22.0. Prisma
validation and generation, lint, both workspace typechecks, all 24 backend
tests, all 9 frontend tests, and both production builds passed. The frontend
build retains Vite's advisory warning for a chunk above 500 kB; no code-splitting
was added because it is outside the approved functional scope. The final diff
and ignored-artifact inspection is reported in the Phase 4 handoff.

The authentication/list recovery work added four focused backend concurrency
checks and four frontend recovery checks. Under Node 22.22.0, the final root
gate passed Prisma validation and generation, lint, both workspace typechecks,
all 27 backend tests, all 13 frontend tests, and both production builds. The
existing Vite chunk-size advisory remains non-failing; code splitting was not
added because it is unrelated to this fix.

The successful-token cache added one focused expiry check and extended the
success/failure concurrency checks. The first sandboxed gate could not open
the E2E harness's localhost ports; rerunning the same gate with that required
permission passed all 29 backend tests, all 13 frontend tests, and every other
Node 22.22.0 check and build. The existing Vite chunk-size advisory remained
non-failing.

Cost and token use were controlled by inspecting only relevant files, running
independent checks in parallel, reusing npm workspace scripts, and avoiding
generated-code review. No subagents were needed for these bounded phases.
