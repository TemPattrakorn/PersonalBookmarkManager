# Draft AGENTS.md guidance

> Help me draft [AGENTS.md](AGENTS.md) for this project.
>
> Context:
> I am working on a take-home exercises for a Full-Stack Developer role at a Banking company. The interviewer are expected me to use AI agent to build the app. Only 10/100 points are for the app merely working, The other 90 are about proving I can orchestrated, reviewed and understood the generated code. Part of the requirement will be deliberately under-specified. So I need to figure out what a requirement actually implies so that I can defending the call I made and the decision need to be documented in [DECISIONS.md](DECISIONS.md) along the development of this project.
>
> What the project is:
> You will build two services for a personal bookmark manager - a private read-later app. A signed-in person saved links, organises them into collections, and nobody else can see any of it.  What most important is the security property at its core "Everything in the app is private to the person who created it. There is no public content, no shared feed, no 'browse other users.' If user A can see, edit, or even learn of the existence of user B's data, the app is broken."
>
> An under-specified requirement:
> "Collections hold bookmarks. A user can delete a collection. A user may want to share a collection with someone else."
>
> Stack:
> Backend API server
> 1. Node.js + TypeScript.
> 2. NestJS for the HTTP layer.
> 3. OIDC authentication on every route, against the Auth0 tenant (I will provide the detail later)
> 4. Two resources. /collections and /bookmarks each supporting: get one, list, create, update (PUT), patch (PATCH), delete, and filtering. Plus a /me endpoint returning the current signed-in person. (I will provide detail later)
> 5. A bookmark belongs to a collection (nullable - a bookmark can be uncategorized), and both belong to a person. Support GET /collections/:id/bookmarks
> 6. SQL persistence for every route.
> 7. Prisma as the ORM.
> 8. Seed data for at least two distinct users.
> Auth
> Auth0 OIDC, Authorization Code flow + PKCE (S256). No implicit flow.
> Frontend website
> 1. React with Vite, TypeScript. (No Next.js)
> 2. React Router ≥ v8 for navigations.
> 3. MUI ≥ v9 for UI components.
> 4. Two pages:
>    1. /collections - list collections, view one, create, delete.
>    2. /bookmarks - list bookmarks, view details, create, delete, filter by collection.
>
> Optional bonuses:
> lightly weighted - do these only when other requirements are fulfilled.
> - Dockerfile
> - CI/CD
> - An /all page - a third frontend page showing collections together with the bookmarks inside them, rather than the two lists side by side.
> - Full-text search - search across bookmark titles and notes.
>
> Repo structure:
> /backend # API server
> /frontend # website
> AGENTS.md  # agent rules file. note that i also have AGENTS.md in [backend](backend/) and [frontend](frontend/) when you deployed the agent file i want you to split the instruction to respective folder.
> /.agent/ # custom commands, subagents, hooks, MCP config
> API_DESIGN.md # your API contract, and how you enforce it
> DECISIONS.md # the calls you made where the spec didn't decide for you
> AI_WORKFLOW.md # how you actually worked with agents
> README.md # how to run, what's done vs skipped
>
> I want you to plan how we will setup Working conventions, What not to do and where the agent will look for instruction before actually working

<details><summary>4 previous messages</summary>

> I’m using the active Ponytail guidance because this is a codebase planning task: the rules should be short, enforceable, and avoid process theater. I’ll inspect the repository and existing instruction/docs files before asking about choices the repo can’t answer.
>
> The repository is intentionally a blank scaffold: the three `AGENTS.md` files exist but contain no real rules, and the four evidence documents are empty. That makes the instruction hierarchy itself the first design decision, rather than something we need to preserve from existing code.
>
> Two choices are now locked: agents must surface material ambiguity before choosing, and sharing remains unimplemented until an explicit authorization contract exists. Documentation also becomes an approval boundary, so the rules need to distinguish “tell me what should change” from “edit the evidence files.” One more pass will pin down when coding itself may begin and what proof every change must leave behind.
>
> Plan
>
> # Project Agent Instruction Plan
>
> ## Summary
>
> Create three concise, inherited instruction files:
>
> - Root `AGENTS.md`: project-wide workflow, security invariant, approval gates, documentation sources, verification, and prohibited actions.
> - `backend/AGENTS.md`: NestJS, Prisma, OIDC, persistence, tenant-isolation, and API-specific rules.
> - `frontend/AGENTS.md`: React, routing, MUI, Auth0 PKCE, API-consumption, and page-scope rules.
>
> Child files add only folder-specific guidance; they do not duplicate the root rules.
>
> ## Root Working Conventions
>
> Require every agent to perform this preflight before editing:
>
> 1. Read root `AGENTS.md`, then the nearest folder-specific `AGENTS.md`.
> 2. Read relevant project sources:
>    - `README.md`: current scope, status, setup, and skipped work.
>    - `DECISIONS.md`: user-approved interpretations of under-specified requirements.
>    - `API_DESIGN.md`: authoritative HTTP contract and authorization behavior.
>    - `AI_WORKFLOW.md`: factual record of agent use, review, verification, and corrections.
>    - Relevant `.agent/` instructions when a command, hook, subagent, or MCP workflow applies.
> 3. Inspect related implementation, tests, callers, and current Git diff/status.
> 4. Present the proposed scope, affected areas, security implications, documentation impact, and verification commands.
> 5. Wait for approval before changing code.
>
> If a material requirement is ambiguous, the agent must present options, tradeoffs, and a recommendation, then wait for a decision. It must not silently choose behavior.
>
> Evidence documents also require explicit approval before editing. Agents should propose the necessary documentation changes during preflight or handoff.
>
> ## Security and Scope Rules
>
> State the non-negotiable invariant: authenticated users must never read, mutate, enumerate, infer, or receive metadata about another user’s collections or bookmarks.
>
> Require agents to:
>
> - Derive identity only from the verified OIDC principal; never trust client-supplied ownership identifiers.
> - Enforce ownership on every lookup, list, filter, nested route, mutation, and deletion—not only in controllers or the frontend.
> - Consider existence leaks, filtering, error behavior, logs, seed data, and nested resources during security review.
> - Add cross-user denial tests whenever a data-access path changes.
> - Never commit credentials, tokens, Auth0 secrets, or sensitive personal data.
> - Treat collection deletion behavior, PUT/PATCH semantics, filter rules, and similar unspecified contract choices as decisions requiring approval.
>
> Explicitly defer collection sharing. No sharing schema, endpoint, UI, or relaxed ownership rule may be introduced until its authorization model is designed and approved in `DECISIONS.md` and `API_DESIGN.md`.
>
> Optional bonuses—Docker, CI/CD, `/all`, and full-text search—remain out of scope until the core requirements pass their gates and the user explicitly approves the bonus work.
>
> ## Folder-Specific Instructions
>
> ### Backend
>
> - Follow the approved API contract; do not invent endpoint semantics.
> - Use NestJS and Prisma patterns already present before adding helpers or dependencies.
> - Persist every resource operation in SQL and keep authorization within the server-side data-access path.
> - Preserve the nullable bookmark-to-collection relationship while validating that any assigned collection belongs to the same authenticated person.
> - Cover `/collections`, `/bookmarks`, nested collection bookmarks, filters, `/me`, and seed isolation for at least two users.
> - Require focused tests during development, followed by applicable test, lint, typecheck, and build gates.
>
> ### Frontend
>
> - Use Vite React with TypeScript, React Router ≥8, and MUI ≥9; do not introduce Next.js or competing UI/router frameworks.
> - Use Auth0 Authorization Code with PKCE S256 only; never implement implicit flow.
> - Treat backend authorization as authoritative and avoid exposing ownership identifiers or token data unnecessarily.
> - Keep core UI limited to `/collections` and `/bookmarks` with the required view, create, delete, and filtering behavior.
> - Reuse existing components and native platform behavior before adding abstractions or dependencies.
> - Require focused component/interaction checks plus applicable test, lint, typecheck, and build gates.
>
> ## Prohibited Actions and Acceptance Checks
>
> Agents must not:
>
> - Edit before plan approval, or edit evidence documents without separate approval.
> - Stage, commit, push, branch, or open a PR unless explicitly requested.
> - Implement unresolved sharing or collection-deletion behavior.
> - weaken tenant isolation for convenience.
> - Add speculative abstractions, dependencies, public content, shared feeds, or unrelated refactors.
> - overwrite unrelated user changes or claim checks were run when they were not.
>
> Validate the drafted rules with four walkthroughs:
>
> 1. A backend bookmark lookup triggers ownership and cross-user test requirements.
> 2. A collection-delete task stops for an approved deletion decision.
> 3. A sharing request stops for authorization and contract design.
> 4. A clear frontend task still produces a preflight plan and waits for approval.
>
> No public application API changes are made by these files; they establish the process governing future API decisions.
</details>

> I have confirmed the plan. Please proceed with the implementation of all AGENTS.md file

<details><summary>3 previous messages</summary>

> I’ll implement the approved three-file hierarchy now. Ponytail keeps the root rules authoritative and the backend/frontend files additive, so the same policy isn’t copied three times.
>
> <details><summary>Edited 3 files</summary>
>
> - Wrote `./AGENTS.md` (+105 -1)
> - Wrote `./backend/AGENTS.md` (+44 -0)
> - Wrote `./frontend/AGENTS.md` (+34 -0)
>
> </details>
>
> The three files are drafted. I’m checking the final diff for contradictory inheritance, accidental duplication, and Markdown/whitespace problems; no application tests are warranted because only instruction text changed.
</details>

Implemented:

- [AGENTS.md](./AGENTS.md) — workflow, approval gates, security, documentation, and prohibitions.
- [backend/AGENTS.md](./backend/AGENTS.md) and [frontend/AGENTS.md](./frontend/AGENTS.md) — stack-specific rules.
- `git diff --check` passes. No tests needed for documentation-only changes; evidence documents and Git staging were untouched.

> Update respective agents.md with this info
>
> # Extracted Reference
>
> Consolidated from the original PDF brief for quick reference while building.
>
> ---
>
> ## 1. OIDC / Auth0 Configuration (§3.1)
>
> ```
> Discovery Endpoint: https://dev-yg.us.auth0.com/.well-known/openid-configuration
> Client ID: H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA
> Callback URL: http://localhost:3000/callback
> Logout URL: http://localhost:3000
> Scope: openid profile email
> API Audience (available): https://bbl-candidate-test-api
>
> Test user: candidate@test.com
> Test password: @password1234
> ```
>
> **Secrecy notes:**
> - Discovery Endpoint, Client ID, Callback/Logout URL, Scope, API Audience — all
>   public by design (this is a public/SPA client using PKCE, not a confidential
>   client). Safe to commit directly in README/config.
> - Test user credentials — a real, working login. Keep these out of tracked
>   `.env` files; use a `.env.example` with placeholders and gitignore the real
>   `.env`. Fine to state the actual test password in README since BBL provided
>   it explicitly for this purpose, but gitignoring is cleaner practice.
>
> ---
>
> ## 2. Suggested Data Shape (§3.1)
>
> ```
> Collection
>   id
>   name
>   ownerId
>   createdAt
>   updatedAt
>
> Bookmark
>   id
>   url
>   title
>   notes?          (optional)
>   collectionId?    (optional/nullable — bookmark can be uncategorised)
>   ownerId
>   createdAt
>   updatedAt
> ```
>
> Note: this is a *suggested* shape only — brief explicitly allows refining it,
> provided any changes are justified (in `DECISIONS.md`).
>
> ---
>
> ## 3. Submission Rules (§5)
>
> ### Required repo structure
> ```
> /backend         # API server (§3.1)
> /frontend        # website (§3.2)
> CLAUDE.md        # or AGENTS.md / .github/copilot-instructions.md — agent rules file
> /.agent/         # custom commands, subagents, hooks, MCP config
> API_DESIGN.md    # API contract, and how it's enforced
> DECISIONS.md     # calls made where the spec didn't decide for you
> AI_WORKFLOW.md   # how you actually worked with agents
> /transcripts/    # real agent session logs
> README.md        # how to run, what's done vs skipped
> ```
>
> ### What each deliverable must contain
>
> - **Agent rules file** — everything a fresh agent session needs to produce
>   on-spec code without you re-explaining the project.
> - **`/.agent/`** — at least one *reusable* agent capability genuinely used
>   (custom slash command, subagent, prompt template, hook, CI gate, or MCP
>   integration). Include the definition, and note when/why it's invoked.
> - **`API_DESIGN.md`** — resources, verbs, status codes, list/filter params,
>   error shape, the collections↔bookmarks relation and its on-delete behavior,
>   and how the privacy invariant (§3) is enforced in code. Call out 2–3 places
>   the agent's first attempt was wrong, and how each was found/corrected.
> - **`DECISIONS.md`** — ADR-style, short: ambiguities hit (§3.3 isn't the only
>   one), what was chosen, what was traded away, and how the agent was steered
>   to implement *your* decision instead of its default.
> - **Automated tests** — what's tested (and not) is one of the strongest
>   signals in the submission. Every claim about the app should be runnable by
>   a reviewer.
> - **`AI_WORKFLOW.md`** — 1–2 pages: tools/models used; how work was
>   decomposed; 2–3 things AI did well; 2–3 places it failed and how you
>   recovered; one prompt that worked and one that didn't; any cost/token
>   awareness.
> - **`/transcripts/`** — real session logs or prompt history, including the
>   messy parts. Redact secrets only, keep the substance — "we read these."
> - **`README.md`** — setup/run steps, how to run tests, and a short "what I
>   completed vs skipped and why."
>
> ### Commit history rule
> Commit history is itself graded. Commit in meaningful steps that show how the
> work actually unfolded (scaffolding → features → fixes). A single "initial
> commit" with the finished project tells them nothing and hides what they care
> about most: where the agent went wrong and where you corrected it.
> **Do not squash commits before submitting.**

<details><summary>4 previous messages</summary>

> I’ll fold the brief into the root rules, put token-verification details in the backend file, and put SPA redirect/client details in the frontend file. The real test password will stay out of tracked `AGENTS.md`; agents will be told to source it from an ignored environment file. Ponytail applies here by keeping each fact in one authoritative place.
>
> <details><summary>Edited 3 files</summary>
>
> - Wrote `./AGENTS.md` (+24 -6)
> - Wrote `./backend/AGENTS.md` (+12 -2)
> - Wrote `./frontend/AGENTS.md` (+13 -0)
>
> </details>
>
> The brief is now split by responsibility. I’ve also made the credential boundary explicit: Auth0 SPA identifiers are committed public configuration, while the working test password must never enter tracked files or a `VITE_` client variable. I’m doing the final consistency check now.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./AGENTS.md` (+3 -0)
>
> </details>
</details>

Updated all three files:

- [AGENTS.md](./AGENTS.md): submission evidence, required layout, transcripts, reusable agent capability, and commit-history rules.
- [backend/AGENTS.md](./backend/AGENTS.md) and [frontend/AGENTS.md](./frontend/AGENTS.md): Auth0 configuration and suggested schema.
- Real test password remains excluded from tracked files. `git diff --check` passes.
