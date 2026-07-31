# PersonalBookmarkManager agent rules

These rules apply to the whole repository. A nearer `AGENTS.md` adds
directory-specific rules; it does not replace this file unless it says so.

## Non-negotiable security invariant

Everything is private to the authenticated person who created it by default.
The only approved cross-user exception is an explicit `CollectionShare`,
which lets its named grantee read that collection and its current bookmarks.
Only the owner may change or delete collections or bookmarks, manage shares,
or access uncategorized bookmarks.

Treat any disclosure outside an active share, including IDs, counts, filter
results, owner profile data, error differences, and nested-resource behavior,
as a security bug.

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
- changes to collection sharing and its authorization model;
- `PUT` versus `PATCH` semantics;
- filtering, pagination, validation, and error semantics;
- schema changes, destructive data behavior, or compatibility breaks.

The only approved sharing model is the read-only, email-addressed collection
grant recorded in `DECISIONS.md` and `API_DESIGN.md`. Do not add roles,
shareable links, copies, pending invitations, notifications, public access,
user browsing, or any other sharing behavior without a new approved decision.

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
- Enforce owner-or-grantee access server-side for approved shared reads and
  ownership for every other get, list, filter, nested lookup, create, update,
  patch, and delete operation.
- Never rely on the frontend to enforce privacy.
- Never commit or log access tokens, credentials, Auth0 secrets, or sensitive
  personal data.
- Every changed data-access path needs tests for the owner, an active grantee
  where applicable, and an outsider who cannot access or infer the data.

## Documentation and evidence

Do not edit `DECISIONS.md`, `API_DESIGN.md`, `AI_WORKFLOW.md`, or `README.md`
without explicit approval. Propose the exact documentation impact with the
code plan or handoff. Once approved, update the affected document in the same
logical change as the behavior it describes.

- Preserve the required submission layout: `backend/`, `frontend/`, `.agent/`,
  `AGENTS.md`, `API_DESIGN.md`, `DECISIONS.md`,
  `AI_WORKFLOW.md`, and `README.md`.
- `.agent/` must contain at least one reusable capability that was genuinely
  used, such as a command, subagent, prompt template, hook, CI gate, or MCP
  integration. Include its definition and document when and why it was used.
- `API_DESIGN.md` must cover resources, verbs, status codes, list/filter
  parameters, error shape, the collection-bookmark relationship and on-delete
  behavior, and where privacy is enforced. Record 2–3 incorrect agent attempts
  and how review found and corrected them.
- `DECISIONS.md` contains short ADR-style entries for accepted choices,
  alternatives and tradeoffs, and how the agent was steered away from its
  default. Do not record unapproved ideas as decisions.
- `AI_WORKFLOW.md` is a factual 1–2 page account of tools/models, task
  decomposition, 2–3 successes, 2–3 failures and recoveries, one effective
  and one ineffective prompt, and cost/token awareness. Never claim review or
  checks that did not occur.
- `README.md` contains setup and run steps, test commands, and what was
  completed or skipped with reasons.
- Automated tests are submission evidence: every behavioral or security claim
  must be reproducible by a reviewer, and untested areas must be stated.

## Do not

- Do not edit before plan approval or exceed the approved scope.
- Do not stage, commit, push, create branches, or open pull requests unless
  explicitly requested. When requested, make meaningful chronological commits
  that expose scaffolding, features, review fixes, and corrections; never
  squash them before submission.
- Do not weaken tenant isolation beyond the approved read-only collection
  grant or reveal whether another user's unshared resource exists.
- Do not add public content, a shared feed, or browsing across users.
- Do not implement optional bonuses until all core requirements pass their
  gates and the user explicitly approves the bonus.
- Do not add speculative infrastructure, dependencies, or abstractions.
