# Fix intermittent Retry loading

> ### Agent handoff
>
> After Auth0 sign-in, parallel collection/bookmark requests intermittently returned `500` and `503`. A bookmark saved successfully but appeared to disappear after navigating away because the failed reload was rendered as an empty list—no data was deleted.
>
> Root causes:
>
> - Every authenticated request independently called Auth0 `/userinfo` and performed a Prisma person upsert. React Strict Mode and parallel page loading created simultaneous duplicate synchronization work.
> - `usePagedList` initialized with an empty array, so an initial request failure looked identical to a successful empty response.
> - This was not frontend Auth0 state loss: only `401` changes the session to signed-out; `500`/`503` preserve it.
> - Separate test-runner trap: lifecycle commands must explicitly select Node 22.22.0. Shell Node 24 causes the real-Prisma test harness to return misleading `/me` `500` responses.
>
> Implemented fix:
>
> - Same-token concurrent authentication requests share only the active `/userinfo` + upsert promise, keyed by a SHA-256 header digest. It is removed after success or failure; sequential requests still synchronize freshly.
> - Lists track successful loading, retain same-source data after refresh failure, clear data when filters change, and show Retry rather than an empty-state message.
> - Bookmark Retry reloads its list and collection metadata together.
>
> Verification under Node 22.22.0: `npm run check` passed with 27 backend tests and 13 frontend tests. Changes remain uncommitted and unstaged.
>
> This bug still exits click 'retry' multiple times sometimes help and the data loaded properly.

<details><summary>3 previous messages</summary>

> I’ll trace the retry path end to end and inspect the existing uncommitted fix. Per the repository rules, I’ll return with a small, security-aware plan and wait for your approval before editing.
>
> The worktree is currently clean, despite the handoff saying the changes were unstaged. I’m checking the committed retry implementation and its callers now; that mismatch matters because the remaining bug may be in a later state transition rather than the original patch.
>
> The remaining failure is consistent with the current contract: coalescing prevents duplicate work only while one request is active, but the first `/userinfo` outage still fails the entire batch, and the next retry starts a fresh Auth0 synchronization. The existing tests verify coalescing and UI presentation, not recovery from repeated live upstream failures.
</details>

The remaining bug is caused by the approved “no completed cache” behavior: every later request batch again depends on `/userinfo`, so Retry merely repeats the same fragile synchronization.

Recommended fix: cache only successful synchronization results per exact token digest, bounded by the verified token expiry; never cache failures. This changes profile freshness from “every request” to “every access token.”

Plan:

- Update backend authentication and add one focused cache-expiry/failure test.
- Keep frontend retry behavior unchanged.
- Update `DECISIONS.md`, `API_DESIGN.md`, `README.md`, and `AI_WORKFLOW.md`.
- Run the full Node 22.22.0 `npm run check` security suite.

Worktree is clean; no edits made. Approve this plan and semantic change?

> approve. commit as you work, use tag and conventional commits in commit message.

<details><summary>11 previous messages</summary>

> Approved. I’ll implement the smallest backend-only runtime fix, commit code/tests first with a conventional `fix(auth):` message, then commit the approved documentation updates separately with `docs(auth):`. The cache will accept only a previously verified exact token and stop serving it at JWT expiry.
>
> The implementation will reuse the existing SHA-256 key and in-flight map. I’m adding one successful-result map—not a general cache layer—and carrying the already verified JWT expiry out of the Auth0 client so expired tokens are never served.
>
> <details><summary>Edited 5 files</summary>
>
> - Wrote `./backend/src/auth.contract.ts` (+1 -0)
> - Wrote `./backend/src/auth.service.ts` (+33 -7)
> - Wrote `./backend/src/auth0.client.ts` (+12 -5)
> - Wrote `./backend/test/e2e/auth.errors.e2e.spec.ts` (+4 -0)
> - Wrote `./backend/test/e2e/auth.identity.e2e.spec.ts` (+38 -14)
> - Wrote `./backend/test/e2e/auth.identity.e2e.spec.ts` (+22 -0)
>
> </details>
>
> The focused implementation checks pass under Node 22: backend typecheck, root lint, and the backend suite. I’m committing this verified code/test slice now as `fix(auth): ...`; documentation remains unstaged for the second commit.
>
> Code commit created: `b7d9e7f fix(auth): cache verified token synchronization`. The approved cache changes only availability/profile-freshness behavior; ownership and sharing authorization remain untouched. I’m now aligning the four approved documents with that exact boundary.
>
> <details><summary>Edited 4 files</summary>
>
> - Wrote `./AI_WORKFLOW.md` (+7 -0)
> - Wrote `./DECISIONS.md` (+26 -20)
> - Wrote `./README.md` (+6 -0)
> - Wrote `./api-design/core.md` (+15 -12)
>
> </details>
>
> The full gate reached the backend suite with all preceding checks passing, but this repository’s Jest reporter again emitted no completion summary and the captured output stopped before frontend/build. I’m verifying the command’s actual exit status and running the remaining gates explicitly before documenting a pass.
>
> The backend runner is exhibiting the repository’s documented no-summary hang rather than returning a result; it has remained silent well beyond normal execution. I’m stopping that stuck invocation, then I’ll use the repository’s shared E2E entrypoint with explicit selection and inspect the open-handle cause if necessary.
>
> The gate failure is environmental, not behavioral: every HTTP test failed at `listen EPERM 127.0.0.1`; the two non-network backend tests and all 13 frontend tests passed. I’m rerunning the same Node 22 gate with localhost-listen permission, as required by this repository’s E2E harness.
>
> The complete gate now passes with localhost permission: 29 backend tests, 13 frontend tests, lint, both typechecks, Prisma validation/generation, and both builds. I’m recording those exact results, then I’ll create the separate documentation commit.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./AI_WORKFLOW.md` (+7 -0)
>
> </details>
</details>

Fixed and committed. Successful exact-token auth synchronization is cached only until verified JWT expiry; failures are never cached.

- `b7d9e7f fix(auth): cache verified token synchronization`
- `161c13f docs(auth): record verified token cache contract`
- Node 22 `npm run check`: 29 backend and 13 frontend tests passed; worktree clean. Existing Vite chunk advisory remains.
