# AI workflow

This is a factual working record through Phase 1. It will be refined as later
phases add authenticated behavior and security evidence.

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
one reusable verification command. Auth0, API routes, resource UI, seed users,
and behavioral sharing tests remain deferred until there is behavior to test.

Ponytail full mode was used to challenge unnecessary scaffolding. It led to a
single root lockfile and lint configuration, native npm workspaces, no
concurrent-process package, Node's native `.env` loading, one Prisma provider,
and server-rendered frontend testing without jsdom or Testing Library.

## What worked

1. Contract-first review exposed privacy-sensitive ambiguities before code.
   The approved documents now define private-by-default ownership, the narrow
   read-only share exception, atomic collection cleanup, and non-disclosing
   errors.
2. Root workspace scripts provide one repeatable gate across Prisma, backend,
   and frontend work. Prisma client generation runs during install and backend
   builds, so generated code does not need to be tracked.
3. Small smoke tests caught integration issues without inventing Phase 2
   behavior: Nest resolves the Prisma provider, and React server-renders a
   semantic `main` and heading while MUI is active.

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
3. Verification exposed environment assumptions: Prisma Client's runtime proxy
   made an `instanceof` smoke assertion unreliable, the preflight initially
   relied on implicit Node lint globals, and npm child scripts found system
   Node 20 until the required Node 22 bin directory was placed first on `PATH`.
   The test now checks Prisma's stable `$disconnect` capability, native globals
   are imported explicitly, and the final gate ran under Node 22.22.0.

## Prompt quality

The effective prompt was the approved Phase 1 plan: it named exact versions,
boundaries, artifacts, and checks. That made implementation decisions
testable and kept authentication and feature work out of the foundation.

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

Cost and token use were controlled by inspecting only relevant files, running
independent checks in parallel, reusing npm workspace scripts, and avoiding
generated-code review. No subagents were needed for this bounded foundation.
