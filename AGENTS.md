# PersonalBookmarkManager agent rules

These rules apply to the whole repository. A nearer `AGENTS.md` adds
directory-specific rules; it does not replace this file unless it says so.

## Non-negotiable security invariant

Everything is private to the authenticated person who created it. A person
must never be able to read, change, delete, enumerate, or infer the existence
of another person's collections or bookmarks.

Treat any cross-user disclosure, including IDs, counts, filter results, error
differences, and nested-resource behavior, as a security bug.

## Before changing anything

1. Read this file and the nearest directory-specific `AGENTS.md`.
2. Read the sources relevant to the task:
   - `README.md` for scope, setup, status, and intentionally skipped work.
   - `DECISIONS.md` for approved interpretations of ambiguous requirements.
   - `API_DESIGN.md` for the approved HTTP and authorization contract.
   - `AI_WORKFLOW.md` for the expected record of agent use and review.
   - Relevant `.agent/` instructions when using its commands, hooks,
     subagents, or MCP configuration.
3. Inspect the related implementation, tests, callers, and current Git diff.
   Do not ask the user for facts available in the repository.
4. Propose a short plan naming the scope, affected areas, security impact,
   documentation impact, and checks to run.
5. Wait for approval before editing code.

Approval covers only the proposed scope. Stop and ask again if implementation
reveals a material ambiguity or requires a meaningful change to the plan.

## Under-specified requirements

Do not silently invent product or API behavior. Present the viable options,
their tradeoffs, and a recommendation, then wait for the user's decision.
This includes, but is not limited to:

- collection deletion and its effect on bookmarks;
- collection sharing and its authorization model;
- `PUT` versus `PATCH` semantics;
- filtering, pagination, validation, and error semantics;
- schema changes, destructive data behavior, or compatibility breaks.

Collection sharing is deferred. Do not add sharing tables, endpoints, UI, or
exceptions to private ownership until an authorization model is explicitly
approved and recorded in both `DECISIONS.md` and `API_DESIGN.md`.

If project documents conflict, stop and ask; do not choose a winner.

## Working conventions

- Make the smallest change that fully satisfies the approved requirement.
- Reuse existing code, platform features, and installed dependencies before
  adding abstractions or packages.
- Keep controllers/components thin and put a rule in the shared path used by
  all affected callers. Fix root causes, not one reported route or screen.
- Validate input at trust boundaries and handle failures that could leak data
  or cause data loss.
- Preserve unrelated user changes. Do not reformat or refactor unrelated code.
- Add the smallest focused automated test that would fail if non-trivial new
  behavior regressed.
- Run focused tests while working, then the applicable full test, lint,
  typecheck, and build gates before handoff.
- Report exactly what ran and any failures or skipped checks.

## Authentication and ownership

- Every API route requires Auth0 OIDC authentication unless the user approves
  and documents an explicit exception.
- Derive identity only from the verified OIDC principal. Never accept a
  person/owner ID from request data as authority.
- Enforce ownership server-side for every get, list, filter, nested lookup,
  create, update, patch, and delete operation.
- Never rely on the frontend to enforce privacy.
- Never commit or log access tokens, credentials, Auth0 secrets, or sensitive
  personal data.
- Every changed data-access path needs a test proving one seeded user cannot
  access or infer another seeded user's data.

## Documentation and evidence

Do not edit `DECISIONS.md`, `API_DESIGN.md`, `AI_WORKFLOW.md`, or `README.md`
without explicit approval. Propose the exact documentation impact with the
code plan or handoff. Once approved, update the affected document in the same
logical change as the behavior it describes.

- `DECISIONS.md` records accepted choices and rationale, not unapproved ideas.
- `API_DESIGN.md` records the implemented contract and privacy enforcement.
- `AI_WORKFLOW.md` records factual agent roles, review, corrections, and
  verification; never claim human review or checks that did not occur.
- `README.md` records how to run the project and what is complete or skipped.

## Do not

- Do not edit before plan approval or exceed the approved scope.
- Do not stage, commit, push, create branches, or open pull requests unless
  explicitly requested.
- Do not weaken tenant isolation for convenience or reveal whether another
  user's resource exists.
- Do not add public content, a shared feed, or browsing across users.
- Do not implement optional bonuses until all core requirements pass their
  gates and the user explicitly approves the bonus.
- Do not add speculative infrastructure, dependencies, or abstractions.
