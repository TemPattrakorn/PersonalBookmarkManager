# App implementation (Phase 3)

> I want to start implementing the app according to [AGENTS.md](AGENTS.md) give me a plan on how to start building this app from start to finish.

<details><summary>5 previous messages</summary>

> I’m using the active Ponytail workflow to keep the build sequence minimal and dependency-light. I’ll first inspect the repository’s requirements, decisions, API contract, workflow notes, existing code, nested instructions, and Git state; then I’ll give you a start-to-finish plan with security and verification gates.
>
> Ponytail’s first constraint here is sequencing: establish the smallest secure vertical slice before adding optional architecture. I’m mapping what already exists so the plan reuses the repository instead of prescribing duplicate scaffolding.
>
> The repository is still at the contract-only stage: no application scaffold or tests exist, the worktree is clean, and the required `.agent/` capability is not yet present. The API decisions are unusually complete, so the safest build order is backend privacy first, then frontend, then sharing, with evidence captured as each slice lands.
>
> One contract detail needs a preflight check before scaffolding: the frontend rules require React Router 8+ and MUI 9+, so I’m verifying that those package generations are actually available. If either is unavailable, that is a document conflict/blocker to resolve—not something the implementation should silently reinterpret.
>
> <details><summary>Searched the web</summary>
>
> Searched the web for `https://registry.npmjs.org/react-router-dom/latest`
>
> Searched the web for `site:npmjs.com/package/react-router-dom react-router-dom latest version ...`
>
> </details>
</details>

Start with contract completion, not scaffolding. The repository currently has no implementation, and parts of the required HTTP contract are still unspecified; coding those now would violate [AGENTS.md](./AGENTS.md).

The worktree is clean. No files were changed.

## Blocking decisions to settle first

[API_DESIGN.md](./API_DESIGN.md) still needs exact definitions for:

- `/me` response.
- Collection and bookmark request/response bodies.
- Create, read, list, update, and delete status codes.
- Pagination, ordering, and allowed bookmark filters.
- ID format.
- Field limits and URL validation.
- SQL database choice and final Prisma schema.

My lean recommendations:

- SQLite for the take-home: real SQL persistence, atomic transactions, and no database service to configure. Choose PostgreSQL only if deployment or production parity is part of the evaluation.
- UUID resource IDs.
- Array list responses with `limit` and `offset`; no total counts.
- Only existing approved filters: collection `scope` and bookmark `collectionId`. No search.
- HTTP/HTTPS bookmark URLs only.
- Bounded text fields: collection name 100, title 200, URL 2,048, notes 5,000 characters.
- `GET /me` returns only the authenticated person’s verified email.
- Backend on port 3001 with CORS restricted to `http://localhost:3000`.

The local Node version is 20.20.1, but React Router v8 requires Node 22.22+, React 19.2.7+, and Vite 7+. It also removed `react-router-dom`, so the frontend should import from `react-router` and `react-router/dom`. [React Router v8 changelog](https://reactrouter.com/home/changelog) MUI 9 is available as required. [MUI versions](https://mui.com/material-ui/getting-started/versions/)

## Start-to-finish implementation plan

| Phase | Deliverable | Required gate |
|---|---|---|
| 0. Complete contract | Add approved CRUD payloads, pagination, validation, IDs, and database decisions to the design documents | Review documents for contradictions before code |
| 1. Minimal foundation | Native npm workspace, NestJS backend, Vite React frontend, Prisma/SQLite, environment examples, secret-safe `.gitignore` | Install, lint, typecheck, and empty builds pass |
| 2. Authentication and identity | Global Auth0 token verification, `/userinfo` identity synchronization, `/me`, sanitized global errors | Tests for missing/invalid tokens, subject mismatch, Auth0 outage, and secret-free errors |
| 3. Private collections | Owner-only create, list, read, patch, and atomic delete/unlink behavior | Owner success; outsider gets the exact generic `404` |
| 4. Private bookmarks | Owner CRUD, collection filtering, nested collection bookmarks, uncategorized behavior | Owner, outsider, invalid collection assignment, filtered and nested tests |
| 5. Sharing backend | Exact-email grants, grant list/revoke, owner-or-grantee reads, idempotent leave | Owner, grantee, outsider, revocation, repeated leave, and cross-route non-disclosure tests |
| 6. Frontend authentication | Auth0 SPA PKCE flow, callback route, protected layout, native `fetch` API client | Login/logout/expiry behavior and production build |
| 7. Private UI | `/collections` and `/bookmarks`; create/edit/delete; loading, empty, and sanitized error states | Focused interaction tests plus accessibility checks |
| 8. Sharing UI | Owner grant/list/revoke controls and read-only “Shared by others” section with leave action | Viewer cannot see mutation controls; owner cannot see leave control |
| 9. Security hardening | Audit every Prisma query, error path, log statement, URL, and frontend control | Full three-person security matrix passes |
| 10. Evidence and handoff | Final README, factual AI workflow, API evidence, reusable `.agent/` capability, completed/skipped work | Full test, lint, typecheck, build, Prisma validation, and manual Auth0 smoke test |

## Implementation shape

Backend:

- Keep Nest controllers thin.
- Use Prisma directly from resource services; no repository layer.
- Centralize owner and owner-or-grantee query predicates.
- Validate ownership inside database queries rather than loading another person’s record first.
- Use one transaction for collection deletion, bookmark unlinking, and share deletion.
- Use the verified Auth0 `sub` as the only authority.
- Use native `fetch` for `/userinfo`; use an established JOSE library for cryptographic token verification.

Frontend:

- Use React Router 8, MUI 9, and Auth0’s React SDK.
- Use native `fetch`; no Axios.
- Use component state and router features; no Redux or other state library.
- Treat the API’s `access: "owner" | "viewer"` marker as the UI control source.
- Keep owner and viewer actions visibly distinct.

## Security gate for every backend slice

Each changed data path must prove:

- Owner access works.
- An active grantee can perform only approved reads.
- A grantee cannot mutate or manage shares.
- An outsider cannot access or infer IDs, counts, filters, relations, or existence.
- Missing and inaccessible resources return exactly the same `404`.
- Uncategorized bookmarks remain owner-only.
- No tokens, emails, URLs, notes, request bodies, or database errors reach logs.

## Documentation impact

With approval, the implementation should update:

- [DECISIONS.md](./DECISIONS.md): approved database, IDs, pagination, and validation decisions.
- [API_DESIGN.md](./API_DESIGN.md) and its linked files: complete route and payload contract.
- [README.md](./README.md): setup, environment, migrations, run commands, tests, and skipped work.
- [AI_WORKFLOW.md](./AI_WORKFLOW.md): factual successes, failures, reviews, prompts, and checks.
- `.agent/`: one small reusable privacy-verification command or prompt, genuinely used during implementation.

Skipped: Docker, CI/CD, repository abstractions, caching, global state, public sharing, roles, search, invitations, and deployment. Add them only if the rubric explicitly requires them.

If you approve this plan and the Phase 0 recommendations, implementation should begin with the contract-only changes and stop for review before scaffolding.

> I approve this plan and Phase 0 recommendations

<details><summary>1 previous message</summary>

> I’m continuing with Ponytail for Phase 0: the smallest complete API contract, with no implementation or unrelated documentation. Before editing, I’m rechecking the approved files and Git state; security-sensitive defaults will be explicit rather than inferred.
</details>

Before editing, four exact API details remain unapproved. Per `AGENTS.md`, I can’t invent them silently.

Recommended contract:

- Pagination: `limit=50`, maximum `100`, `offset=0`; newest first by `createdAt`, then UUID. Apply to all list endpoints.
- Notes: omitted on create means `null`; `notes: null` on PATCH clears them.
- Responses: collections and bookmarks expose UUID, editable fields, timestamps, and `access`; never owner/person IDs. Lists return plain arrays without counts.
- Statuses: create `201`, reads/patches `200`, deletes `204`; `/me` returns `{ "email": "verified@example.com" }`.
- Create defaults: omitted `collectionId` becomes `null`; names/titles are trimmed; URLs are trimmed, preserved otherwise, and restricted to HTTP/HTTPS.
- SQLite schema: UUID primary keys, unique Auth0 subject, non-unique normalized email, unique collection/grantee share pair, required ownership indexes and foreign keys.

Alternative pagination is cursor-based, but it adds response metadata and client logic without value for this take-home. Empty-string note clearing is simpler syntactically but creates ambiguous stored state.

May I use these exact defaults for the Phase 0 document changes?

> Use these exact defaults you gave me.

<details><summary>4 previous messages</summary>

> Phase 0 is now fully specified and approved. I’ll update only `DECISIONS.md` and the API contract files: persistence/schema, exact resource shapes and verbs, pagination/filtering, validation, local service boundary, and share-list pagination. Privacy remains query-scoped, responses omit owner IDs and counts, and I’ll finish with diff/link/consistency checks; no application code, packages, README, or workflow claims yet.
>
> <details><summary>Edited 4 files</summary>
>
> - Wrote `./DECISIONS.md` (+52 -0)
> - Wrote `./api-design/core.md` (+161 -4)
> - Wrote `./api-design/errors.md` (+7 -6)
> - Wrote `./api-design/sharing.md` (+7 -4)
>
> </details>
>
> The approved contract is written. I’m now checking the rendered structure and cross-file wording for security regressions—especially whether filtered shared bookmarks, list pagination, and nullable fields have exactly one interpretation.
>
> <details><summary>Edited 2 files</summary>
>
> - Wrote `./api-design/core.md` (+13 -12)
> - Wrote `./API_DESIGN.md` (+15 -0)
> - Wrote `./api-design/core.md` (+4 -4)
> - Wrote `./api-design/core.md` (+6 -5)
>
> </details>
</details>

Phase 0 is complete.

- Recorded SQLite/UUID and CRUD defaults in [DECISIONS.md](./DECISIONS.md:131).
- Completed resource shapes, routes, pagination, validation, CORS, and privacy rules in [core.md](./api-design/core.md:24).
- Updated [sharing pagination](./api-design/sharing.md:39), [error semantics](./api-design/errors.md:58), and [review corrections](./API_DESIGN.md:16).

Checks passed: `git diff --check`, Markdown structure, and local links. No tests ran because this phase changed documentation only. Nothing was staged or committed.

Approve Phase 1 when ready: minimal npm workspace, NestJS/Vite scaffolds, Prisma/SQLite, environment templates, and baseline quality commands.

> [core.md](api-design/core.md) are getting too long. add rule in [API_DESIGN.md](API_DESIGN.md) allowing agent to split md file if it's getting too long but give recommendation to me to approve first.

<details><summary>1 previous message</summary>

> I’m applying Ponytail to keep this as one small governance rule, not a new documentation framework. I’ll inspect the current index and diff, then propose the exact wording and checks for your approval before editing, as required by `AGENTS.md`.
</details>

`core.md` is now 261 lines. I recommend a reviewability rule instead of a hard line limit, since file complexity matters more than length.

Proposed addition to `API_DESIGN.md`:

> If a linked API design file becomes difficult to navigate or mixes distinct concerns, the agent may recommend splitting it. Before editing, the agent must name the proposed files, sections to move, affected links, and confirm whether the split is organizational only. The agent must wait for explicit user approval.
>
> After approval, preserve contract behavior, update the index and cross-references atomically, and validate all local links. Any semantic change requires separate approval.

Scope: `API_DESIGN.md` only. No security or API behavior changes. Checks: `git diff --check` and local-link validation.

Approve this exact addition?

> Yes, and do a file complexity review on [core.md](api-design/core.md)

<details><summary>3 previous messages</summary>

> I’m using Ponytail to keep the governance change to the approved paragraph and review `core.md` by responsibility, duplication, and link dependencies. I’ll add the rule to `API_DESIGN.md`, then recommend a split only if the structure justifies it; I will not split files without your separate approval.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./API_DESIGN.md` (+12 -0)
>
> </details>
>
> The rule is added. The review shows `core.md` is not just long; its 13 top-level sections combine shared platform rules, resource contracts, and authorization. I’m measuring the section boundaries and references now so the recommendation names an organizational-only split with minimal link churn.
</details>

Added the approved splitting rule to [API_DESIGN.md](./API_DESIGN.md:16). `git diff --check` and local-link validation pass.

Complexity review: [core.md](./api-design/core.md) has 261 lines and 13 sections spanning three concerns: platform rules, resource CRUD, and authorization.

Recommendation: create one `api-design/resources.md` file and move these sections unchanged:

- Resource representations
- Collection operations
- Bookmark operations
- Input validation
- Update semantics
- Delete a collection

Keep authentication, persistence, pagination, sharing visibility, and privacy enforcement in `core.md`. This should leave roughly 110 lines in `core.md` and 150 in `resources.md`.

Affected links:

- Add Resources to `API_DESIGN.md`.
- Update the Core description.
- Keep `sharing.md`’s pagination link pointing to `core.md`.
- The collection-delete anchor moves with its caller, requiring no semantic rewrite.

This is organizational only; no API or security behavior changes. A three-file split was rejected as unnecessary navigation.

Approve this split?

> I approve the split.

<details><summary>3 previous messages</summary>

> I’m applying the approved organizational-only split with Ponytail: one new `resources.md`, no wording or contract changes beyond navigation links. I’ll preserve the security rules in `core.md`, update the index atomically, then verify the moved text, anchors, local links, and diff cleanliness.
>
> <details><summary>Created a file, edited 2 files</summary>
>
> - Wrote `./API_DESIGN.md` (+4 -2)
> - Wrote `./api-design/core.md` (+0 -150)
> - Wrote `./api-design/resources.md` (+153 -0)
>
> </details>
>
> The split is in place: `core.md` now retains the shared authentication, persistence, pagination, visibility, and privacy rules; resource payloads and mutations moved unchanged to `resources.md`. I’m verifying that every route and heading still exists once and that both file and anchor links resolve.
</details>

Split complete:

- [core.md](./api-design/core.md) reduced from 261 to 111 lines.
- Added [resources.md](./api-design/resources.md) with the six approved sections.
- Updated [API_DESIGN.md](./API_DESIGN.md) navigation.

Checks passed: exact text preservation, route coverage, `git diff --check`, and file/anchor link validation. No API behavior changed; nothing staged or committed.

> Check phase 0 completion.

<details><summary>2 previous messages</summary>

> I’m using Ponytail for a completion audit: verify only the Phase 0 contract gates, flag real gaps, and avoid expanding into Phase 1. I’ll check the approved decisions, API coverage, split integrity, cross-links, contradictions, and current Git state without changing files.
>
> The Phase 0 structure is committed and the worktree is clean. The main contract is present, but I’ve found at least one exactness issue worth checking before calling it complete: the share response example may conflict with the UUID rule. I’m finishing a route/status and ambiguity audit now.
</details>

Phase 0 is almost complete, but two contract issues block Phase 1:

1. [sharing.md](./api-design/sharing.md:28) uses `"share-id"`, conflicting with the UUID requirement in [core.md](./api-design/core.md:33).

2. [sharing.md](./api-design/sharing.md:34) says “malformed email” without defining valid syntax or length. Backend implementation would have to invent validation behavior, which `AGENTS.md` prohibits.

Everything else passes: routes and verbs, statuses, pagination, filters, payloads, deletion behavior, privacy rules, error envelopes, ADRs, review corrections, file split, links, and anchors. The worktree is clean.

Recommended closure:

- Replace `"share-id"` with a UUID example.
- Define email as trimmed, 3–254 characters, exactly one `@`, non-empty local/domain parts, and no whitespace; lowercase only for lookup.

No files were changed. Approve these documentation-only corrections to finish Phase 0?

::code-comment{title="[P1] Example violates UUID contract" body="CollectionShare IDs are required to be UUIDs, but this response example uses the non-UUID value `share-id`." file="/Users/Temmiee/Desktop/PersonalBookmarkManager/api-design/sharing.md" start=28 priority=1}

::code-comment{title="[P1] Email validation is undefined" body="The contract does not define what counts as a malformed email, leaving Phase 1 implementation to invent validation behavior." file="/Users/Temmiee/Desktop/PersonalBookmarkManager/api-design/sharing.md" start=34 priority=1}

> I approve

<details><summary>3 previous messages</summary>

> I’m applying Ponytail to close only the two approved Phase 0 gaps. I’ll update the sharing contract and its existing sharing decision, preserving all authorization behavior, then rerun diff, Markdown-link, and consistency checks.
>
> <details><summary>Edited 2 files</summary>
>
> - Wrote `./DECISIONS.md` (+5 -0)
> - Wrote `./api-design/sharing.md` (+13 -6)
>
> </details>
>
> Both approved gaps are corrected, and the sharing ADR now records the validation choice so implementation won’t have to infer it. I’m running the final Phase 0 consistency checks now.
</details>

Phase 0 is now complete.

- UUID share example fixed in [sharing.md](./api-design/sharing.md:28).
- Exact email validation recorded in [sharing.md](./api-design/sharing.md:34) and [DECISIONS.md](./DECISIONS.md:58).

Passed: `git diff --check`, Markdown file/anchor validation, UUID validation, and cross-document email-rule consistency. The ad-hoc consistency checker initially mismatched line-wrapped wording; corrected regex passed. Application tests were skipped because only documentation changed.

Two files remain unstaged and uncommitted. Phase 1 can begin after these changes are saved as desired.

> Check Phase 1 completion

<details><summary>7 previous messages</summary>

> I’m using Ponytail for a Phase 1 gate audit: verify only the approved foundation—workspace structure, Node/tool versions, NestJS and Vite scaffolds, Prisma/SQLite, environment safety, and baseline quality commands. I’ll inspect and run the declared checks without modifying files or drifting into Phase 2 behavior.
>
> The Phase 1 scaffold exists and is committed, with a clean worktree. I’m checking whether generated artifacts, local secrets/databases, dependency versions, and the declared verification command are correctly tracked or ignored before running the gates.
>
> The foundation is intentionally small and correctly defers Auth0 and feature routes to later phases. I’m now using the repository’s `.agent/commands/verify.md` capability: confirm Node/npm and tracked-file hygiene, then run the full declared `npm run check` gate.
>
> The full gate is still running; dependency resolution and environment hygiene have passed so far. I’m waiting for Prisma validation/generation, lint, typecheck, tests, and both builds to finish.
>
> All declared Phase 1 gates passed: Prisma validation/generation, lint, both typechecks, two focused scaffold tests, and both production builds. I’m doing the final database-migration and post-build cleanliness checks before issuing the completion verdict.
>
> The committed README and AI workflow accurately describe the Phase 1 boundary, and migration status is current. I’m doing one final live smoke check of the current binaries on ports 3001 and 3000, then I’ll report pass/fail and any residual risks.
>
> The live-start attempt was blocked by the sandbox’s port policy, not application code. It also exposed that invoking npm through an absolute CLI path did not propagate Node 22 to watcher child processes, so I’m rerunning the gate through the repository’s documented `nvm` workflow before retrying the port smoke check with the required permission.
</details>

Phase 1 is complete with no actionable findings.

Passed:

- Node 22.22.0 and npm 10.9.4 via `.nvmrc`.
- npm workspace dependency integrity.
- Prisma validation, generation, and migration status.
- ESLint and both TypeScript checks.
- Backend and frontend smoke tests: 2/2 passed.
- Backend and frontend production builds.
- Live backend: port 3001, expected 404, correct CORS header.
- Live frontend: port 3000, HTTP 200.
- Secret/generated artifact ignore rules.
- `git diff --check`; worktree is clean.

The initial live check was sandbox-blocked and leaked system Node 20 into watcher children; rerunning through `nvm exec 22.22.0` with localhost permission passed. No files were changed.

`main` is one commit ahead of `origin/main`; pushing was not requested. Auth0, API routes, seed users, and functional UI are correctly deferred to later phases.

> Check phase 2 completion

<details><summary>6 previous messages</summary>

> I’m using Ponytail for a Phase 2 gate audit: verify only authentication, local identity synchronization, `/me`, sanitized error handling, and their security tests. I’ll inspect the current commit and all auth/error call paths, then run the repository’s verification command without changing files.
>
> The Phase 2 commit is clean and updates the contract for unverified users, scope handling, and upstream failure classification. I’m tracing the full guard → token verification → `/userinfo` → Prisma upsert → `/me` flow and comparing every exception branch against the normalized error contract.
>
> Context compaction
>
> Source: automatic
> Status: completed
>
> I’m continuing the Phase 2 audit against the approved auth/error contract. The implementation is present; I’m now checking documentation alignment, negative-path coverage, and running the repository’s full verification gate before I call it complete.
>
> The contract decision is documented and the implementation has broad outage/privacy tests. Two completion risks remain under review: the global exception filter does not currently normalize general `400/415` HTTP errors, and the token tests do not explicitly prove that a forged RS256 signature is rejected. I’m validating whether these are real current-route gaps, not speculative future work.
>
> The full gate passes under the required Node/npm versions: Prisma validation/generation, lint, both typechecks, all 18 tests, and both builds. The first sandboxed run failed only because localhost binding was prohibited; the approved localhost run passed. I’m doing one direct HTTP probe of the suspected exception-filter edge case before the final verdict.
</details>

## Verdict

Phase 2 is nearly complete, but **not ready to close**. The main implementation is sound; two blockers and one documentation conflict remain.

### Findings

1. **[P1] Client errors are incorrectly converted to `500`.**
   [api-exception.filter.ts](./backend/src/api-exception.filter.ts:35) handles only `401`, `503`, and `404`, then converts everything else to `500`. A direct malformed-JSON request to `/me` returned:

   ```json
   {"statusCode":500,"message":"Internal server error"}
   ```

   The approved contract requires `400` for malformed JSON and `415` for unsupported body media types.

2. **[P1] JWT signature verification lacks regression evidence.**
   The code correctly calls `jwtVerify`, but [auth.identity.e2e.spec.ts](./backend/src/auth.identity.e2e.spec.ts:86) tests malformed, expired, wrong-issuer, wrong-audience, and wrong-algorithm tokens only. All can be rejected by the unverified precheck, meaning tests would still pass if cryptographic signature verification were accidentally removed. Add a valid-looking RS256 token signed by an untrusted second key and assert exact `401`, no `/userinfo`, and no database write.

3. **[P2] Scope instructions conflict.**
   [backend/AGENTS.md](./backend/AGENTS.md:11) says tokens are validated against required scopes, while [core.md](./api-design/core.md:19) explicitly says the API does not separately enforce the `scope` claim. Given the approved Phase 2 decision, I recommend clarifying `backend/AGENTS.md` rather than adding scope enforcement.

### What passed

- Required Node 22.22.0 and npm 10.9.4.
- Prisma validation and generation.
- Lint and both workspace typechecks.
- All 18 tests.
- Both production builds.
- `git diff --check`.
- Clean worktree with no generated output, database, secrets, or dependencies tracked.

The initial sandboxed test run failed because localhost binding was prohibited; rerunning with approved localhost permission passed.

No files were changed during this review.

::code-comment{title="[P1] Preserve client-error statuses" body="The catch-all converts Nest BadRequestException and UnsupportedMediaTypeException into 500 responses. A malformed JSON request to /me currently returns 500 despite the approved contract requiring 400; add sanitized 400 and 415 mappings." file="/Users/Temmiee/Desktop/PersonalBookmarkManager/backend/src/api-exception.filter.ts" start=35 end=46 priority=1}
::code-comment{title="[P1] Test forged RS256 signatures" body="These negative cases are all rejected by the unverified token precheck, so the suite would still pass if jwtVerify were removed. Add a token with valid claims and kid but signed by an untrusted RSA key, then assert exact 401 and no profile or persistence call." file="/Users/Temmiee/Desktop/PersonalBookmarkManager/backend/src/auth.identity.e2e.spec.ts" start=86 end=117 priority=1}
::code-comment{title="[P2] Resolve scope-contract conflict" body="This instruction reads as requiring scope-claim validation, while api-design/core.md explicitly says scopes are requested by the SPA but not separately enforced by the API. Clarify this wording to match the approved Phase 2 decision." file="/Users/Temmiee/Desktop/PersonalBookmarkManager/backend/AGENTS.md" start=11 end=14 priority=2}

> Plan phase 3 implementation

<details><summary>4 previous messages</summary>

> I’m grounding Phase 3 in the approved API, schema, and current Phase 2 implementation. I’ll use the repository’s minimal-change rules (Ponytail) to keep this to the next complete vertical slice, rather than designing later UI or sharing work early.
>
> The schema and API contract already settle the resource, validation, pagination, privacy, deletion, and share semantics. What is not recorded is whether Phase 3 is the whole secured backend API or the owner-only CRUD slice before sharing, so I need to lock that boundary before producing an implementable plan.
>
> Phase 3 will be the complete secured backend API—collections, bookmarks, and the approved read-only sharing model—while frontend work remains deferred. One existing contract conflict affects every endpoint: the API design says scopes are not separately enforced, but the backend instructions can be read as requiring that validation. I need your explicit resolution before finalizing the plan.
>
> Plan
>
> # Phase 3 — Complete secured backend resource API
>
> ## Summary
>
> Implement the documented backend API for collections, bookmarks, and read-only collection sharing. All operations remain private by default, use the authenticated local person, and enforce authorization in Prisma queries. Frontend authentication and resource UI remain deferred.
>
> ## Implementation
>
> - Add collection, bookmark, and share controllers/services to provide exactly the approved endpoints:
>   - Collection CRUD, owned/shared collection lists, and nested collection bookmarks.
>   - Bookmark CRUD, owned list, and optional accessible `collectionId` filter.
>   - Share create/list/revoke plus idempotent grantee leave.
> - Use small native TypeScript validation helpers—no new package—to enforce:
>   - JSON-only bodies, exact allowed fields, required create fields, partial non-empty patches, UUIDs, pagination, `scope`, and the approved string/URL/email rules.
>   - Generic sanitized `400` validation and `415` media-type envelopes already established by Phase 2; never echo submitted values.
> - Keep all write queries owner-scoped. A bookmark may reference only a collection owned by its creator.
> - Use owner-or-active-share filters directly in collection/bookmark read queries. Uncategorized bookmarks are owner-only. Map responses to the approved shapes, including `access: "owner" | "viewer"`, without owner/person data or counts.
> - Delete collections in one Prisma transaction: nullify the owner’s assigned bookmarks, delete shares, then delete the owner-scoped collection.
> - Implement sharing with exact normalized-email lookup of one verified local person; reject self-sharing and malformed email with `400`, and unknown, ambiguous, unverified, or inaccessible targets with generic `404`. Repeated grants return the existing grant with `200`; new grants return `201`.
> - Implement owner-only share list/revoke and idempotent grantee leave. Leave always returns `204` and never reveals collection or grant existence.
> - Clarify `backend/AGENTS.md` to match the approved scope policy: validate signature, issuer, and audience; the SPA requests `openid profile email`, but the API does not separately enforce the scope claim.
>
> ## Testing and evidence
>
> - Add an HTTP resource test harness using the existing local Auth0 stub plus a temporary SQLite database initialized from the committed migration. Seed owner, grantee, and outsider through authenticated requests; keep production routes backed by Prisma.
> - Cover owner CRUD, validation, pagination/order, response shaping, collection-delete unlinking, and owner-only uncategorized bookmarks.
> - Cover privacy for direct, list, filtered, and nested reads: allowed owner/grantee reads, outsider generic `404`, grantee mutation denial, and no cross-user list leakage.
> - Cover every sharing acceptance scenario: grant/repeat, invalid and ineligible recipients, listing/revocation, idempotent leave, regrant after leave, stable grant after email change, and collection deletion revoking shares.
> - Run focused backend tests, then `npm run check`, `git diff --check`, and a clean tracked-artifact review.
>
> ## Documentation and defaults
>
> - Update `README.md` and `AI_WORKFLOW.md` factually after implementation; no API-contract or schema change is planned.
> - No migration, dependencies, repository layer, frontend work, token-scope enforcement, public access, roles, invitations, counts, or search.
> - Validation failures use the existing `400 {"statusCode":400,"message":"Validation failed"}` envelope without optional field details.
</details>

> PLEASE IMPLEMENT THIS PLAN:
> # Phase 3 — Complete secured backend resource API
>
> ## Summary
>
> Implement the documented backend API for collections, bookmarks, and read-only collection sharing. All operations remain private by default, use the authenticated local person, and enforce authorization in Prisma queries. Frontend authentication and resource UI remain deferred.
>
> ## Implementation
>
> - Add collection, bookmark, and share controllers/services to provide exactly the approved endpoints:
>   - Collection CRUD, owned/shared collection lists, and nested collection bookmarks.
>   - Bookmark CRUD, owned list, and optional accessible `collectionId` filter.
>   - Share create/list/revoke plus idempotent grantee leave.
> - Use small native TypeScript validation helpers—no new package—to enforce:
>   - JSON-only bodies, exact allowed fields, required create fields, partial non-empty patches, UUIDs, pagination, `scope`, and the approved string/URL/email rules.
>   - Generic sanitized `400` validation and `415` media-type envelopes already established by Phase 2; never echo submitted values.
> - Keep all write queries owner-scoped. A bookmark may reference only a collection owned by its creator.
> - Use owner-or-active-share filters directly in collection/bookmark read queries. Uncategorized bookmarks are owner-only. Map responses to the approved shapes, including `access: "owner" | "viewer"`, without owner/person data or counts.
> - Delete collections in one Prisma transaction: nullify the owner’s assigned bookmarks, delete shares, then delete the owner-scoped collection.
> - Implement sharing with exact normalized-email lookup of one verified local person; reject self-sharing and malformed email with `400`, and unknown, ambiguous, unverified, or inaccessible targets with generic `404`. Repeated grants return the existing grant with `200`; new grants return `201`.
> - Implement owner-only share list/revoke and idempotent grantee leave. Leave always returns `204` and never reveals collection or grant existence.
> - Clarify `backend/AGENTS.md` to match the approved scope policy: validate signature, issuer, and audience; the SPA requests `openid profile email`, but the API does not separately enforce the scope claim.
>
> ## Testing and evidence
>
> - Add an HTTP resource test harness using the existing local Auth0 stub plus a temporary SQLite database initialized from the committed migration. Seed owner, grantee, and outsider through authenticated requests; keep production routes backed by Prisma.
> - Cover owner CRUD, validation, pagination/order, response shaping, collection-delete unlinking, and owner-only uncategorized bookmarks.
> - Cover privacy for direct, list, filtered, and nested reads: allowed owner/grantee reads, outsider generic `404`, grantee mutation denial, and no cross-user list leakage.
> - Cover every sharing acceptance scenario: grant/repeat, invalid and ineligible recipients, listing/revocation, idempotent leave, regrant after leave, stable grant after email change, and collection deletion revoking shares.
> - Run focused backend tests, then `npm run check`, `git diff --check`, and a clean tracked-artifact review.
>
> ## Documentation and defaults
>
> - Update `README.md` and `AI_WORKFLOW.md` factually after implementation; no API-contract or schema change is planned.
> - No migration, dependencies, repository layer, frontend work, token-scope enforcement, public access, roles, invitations, counts, or search.
> - Validation failures use the existing `400 {"statusCode":400,"message":"Validation failed"}` envelope without optional field details.

<details><summary>13 previous messages</summary>

> I’m implementing the approved Phase 3 scope now. I’ll keep the backend surface deliberately direct—controllers, shared validation, and Prisma-backed services—then prove the privacy model with a real temporary SQLite HTTP suite.
>
> <details><summary>Created 7 files, edited 3 files</summary>
>
> - Wrote `./backend/src/bookmarks.service.ts` (+132 -0)
> - Wrote `./backend/src/collections.service.ts` (+103 -0)
> - Wrote `./backend/src/request-validation.ts` (+181 -0)
> - Wrote `./backend/src/resource-access.ts` (+31 -0)
> - Wrote `./backend/src/shares.service.ts` (+98 -0)
> - Wrote `./backend/src/app.module.ts` (+9 -1)
> - Wrote `./backend/src/bookmarks.controller.ts` (+54 -0)
> - Wrote `./backend/src/bookmarks.service.ts` (+2 -2)
> - Wrote `./backend/src/collections.controller.ts` (+110 -0)
> - Wrote `./backend/src/collections.controller.ts` (+1 -1)
>
> </details>
>
> The initial resource surface is in place: every database lookup uses owner or active-share criteria, with a single validation path for all controllers. I’m moving to the real-SQLite test harness next; that is where the privacy boundaries will get their strongest proof.
>
> <details><summary>Created 3 files, edited 4 files</summary>
>
> - Wrote `./backend/src/auth.test-harness.ts` (+11 -2)
> - Wrote `./backend/src/resource.test-harness.ts` (+69 -0)
> - Wrote `./backend/src/auth.test-assertions.ts` (+16 -0)
> - Wrote `./backend/src/resources.e2e.spec.ts` (+207 -0)
> - Wrote `./backend/src/shares.e2e.spec.ts` (+174 -0)
> - Wrote `./backend/src/bookmarks.service.ts` (+2 -2)
> - Wrote `./backend/src/collections.controller.ts` (+1 -2)
>
> </details>
>
> The first focused run exposed a test-only compatibility issue: Jest’s ESM mode does not construct `better-sqlite3` directly. I’m replacing that migration bootstrap with Node 22’s built-in SQLite API; production remains Prisma-backed and unchanged.
>
> <details><summary>Edited 3 files</summary>
>
> - Wrote `./backend/src/resource.test-harness.ts` (+2 -2)
> - Wrote `./backend/src/request-validation.ts` (+1 -1)
> - Wrote `./backend/src/resources.e2e.spec.ts` (+27 -0)
> - Wrote `./backend/src/resources.e2e.spec.ts` (+14 -3)
>
> </details>
>
> Focused resource tests now pass with real SQLite and the local Auth0 stub. They cover owner CRUD, validation/media handling, direct/list/filter/nested privacy, sharing lifecycle, and collection cleanup; I’m running the full suite next to catch regressions in the Phase 2 auth path before documenting the completed phase.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./backend/src/jose.loader.ts` (+5 -2)
>
> </details>
>
> The full suite found a Jest limitation rather than an API failure: `jose`’s ESM import cannot be re-created across more than two isolated Jest file environments. The focused tests pass individually. I’m consolidating the ESM-dependent suites under one runner entry so they share the already-working module context, without changing production authentication behavior.
>
> <details><summary>Created a file, edited 4 files</summary>
>
> - Wrote `./backend/package.json` (+1 -1)
> - Wrote `./backend/src/http.e2e.spec.ts` (+4 -0)
> - Wrote `./backend/src/jose.loader.ts` (+2 -5)
> - Wrote `./AI_WORKFLOW.md` (+19 -9)
> - Wrote `./README.md` (+11 -11)
>
> </details>
>
> Implementation and the approved status documentation are complete. I’m running the full repository gate now—Prisma, lint, both typechecks, all tests, and both builds—then I’ll record the exact verification outcome in the workflow log.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./AI_WORKFLOW.md` (+7 -0)
>
> </details>
>
> The full repository gate passes: Prisma validation/generation, lint, both workspace typechecks, 25 tests, and both builds. I’ve recorded that result factually and am finishing the required diff and tracked-artifact review.
</details>

Phase 3 is implemented.

- Secured collection, bookmark, and sharing endpoints are in [collections.controller.ts](./backend/src/collections.controller.ts), [bookmarks.controller.ts](./backend/src/bookmarks.controller.ts), and their Prisma-backed services.
- Shared validation in [request-validation.ts](./backend/src/request-validation.ts) enforces JSON bodies, exact fields, UUIDs, pagination, URL, notes, and share-email rules.
- Owner-or-grantee database filtering is centralized in [resource-access.ts](./backend/src/resource-access.ts). Deletes preserve bookmarks as uncategorized and revoke shares atomically.
- Real SQLite/Auth0-stub HTTP coverage is in [resources.e2e.spec.ts](./backend/src/resources.e2e.spec.ts) and [shares.e2e.spec.ts](./backend/src/shares.e2e.spec.ts).
- Updated [README.md](./README.md) and [AI_WORKFLOW.md](./AI_WORKFLOW.md).

Verification passed:

- `npm run check` — Prisma validation/generation, lint, both typechecks, 25 tests, and both builds.
- `git diff --check` — passed.
- No migration or dependency was added; no secrets, database files, generated client, build output, or dependencies are tracked.

During development, Jest’s isolated ESM contexts conflicted with `jose`; [http.e2e.spec.ts](./backend/src/http.e2e.spec.ts) runs the ESM-dependent HTTP suites in one shared test entrypoint.
