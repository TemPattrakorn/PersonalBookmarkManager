# Clarify collection deletion behavior

> Go over Under-specified requirements. About collection deletion and its effect on bookmarks in [AGENTS.md](AGENTS.md)

<details><summary>3 previous messages</summary>

> I’m using the repository’s minimal-solution guidance to compare the viable deletion behaviors against the existing API and data model, then I’ll surface the one decision that needs to be recorded.
>
> The repository has no implementation yet, and both `API_DESIGN.md` and `AI_WORKFLOW.md` are empty. The backend rules explicitly prohibit choosing deletion semantics until they are approved in both `DECISIONS.md` and `API_DESIGN.md`; the current accepted Auth0 decision does not resolve this.
>
> Plan
>
> # Define collection-deletion behavior
>
> ## Summary
>
> Approve collection deletion as non-destructive to bookmarks: deleting an owned collection unlinks its bookmarks (`collectionId = null`).
>
> ## Contract and documentation
>
> - Record an ADR in `DECISIONS.md` choosing unlinking over blocking deletion and cascading bookmark deletion.
> - Define `DELETE /collections/:id` in `API_DESIGN.md`:
>   - `204 No Content` after deleting the collection and uncategorizing its bookmarks.
>   - Uniform `404` for nonexistent and other-user collection IDs.
>   - The unlink and delete occur atomically and apply only to the authenticated owner’s data.
> - Do not add sharing behavior, deletion summaries/counts, or bookmark deletion.
>
> ## Future implementation and checks
>
> - Use the nullable collection relationship and a transaction/foreign-key behavior that preserves bookmarks while clearing their collection reference.
> - Test successful unlinking, empty-collection deletion, and indistinguishable cross-user/nonexistent deletion responses.
>
> ## Assumptions
>
> - The selected behavior applies to all collection deletions, including API and future UI.
> - This plan covers documentation and the approved contract; no code has been changed.
</details>

> PLEASE IMPLEMENT THIS PLAN:
> # Define collection-deletion behavior
>
> ## Summary
>
> Approve collection deletion as non-destructive to bookmarks: deleting an owned collection unlinks its bookmarks (`collectionId = null`).
>
> ## Contract and documentation
>
> - Record an ADR in `DECISIONS.md` choosing unlinking over blocking deletion and cascading bookmark deletion.
> - Define `DELETE /collections/:id` in `API_DESIGN.md`:
>   - `204 No Content` after deleting the collection and uncategorizing its bookmarks.
>   - Uniform `404` for nonexistent and other-user collection IDs.
>   - The unlink and delete occur atomically and apply only to the authenticated owner’s data.
> - Do not add sharing behavior, deletion summaries/counts, or bookmark deletion.
>
> ## Future implementation and checks
>
> - Use the nullable collection relationship and a transaction/foreign-key behavior that preserves bookmarks while clearing their collection reference.
> - Test successful unlinking, empty-collection deletion, and indistinguishable cross-user/nonexistent deletion responses.
>
> ## Assumptions
>
> - The selected behavior applies to all collection deletions, including API and future UI.
> - This plan covers documentation and the approved contract; no code has been changed.

<details><summary>2 previous messages</summary>

> I’ll record only the approved deletion contract in the two specified documents. No API code exists in this repository, so there is no deletion path or automated test to modify yet.
>
> <details><summary>Edited 2 files</summary>
>
> - Wrote `./API_DESIGN.md` (+16 -0)
> - Wrote `./DECISIONS.md` (+23 -0)
>
> </details>
</details>

Implemented the approved collection-deletion contract.

- Added ADR to [DECISIONS.md](./DECISIONS.md:29).
- Defined authenticated, atomic `DELETE /collections/:id` behavior in [API_DESIGN.md](./API_DESIGN.md:3).
- Verified with `git diff --check`.

Skipped API code/tests: this repository currently contains no backend implementation.

> go over collection sharing and its authorization model requirement in [AGENTS.md](AGENTS.md) . Present me with architectural design options. I will provide decision later.

<details><summary>1 previous message</summary>

> I’m using Ponytail’s design lens here because the safest answer is the smallest authorization model that fully satisfies the chosen sharing behavior. I’ll first reconcile the repository’s privacy rules and current API decisions, then present concrete options without recording or implementing one.
</details>

The repository currently forbids collection sharing outright: resources are private to their creator, every route requires authentication, and sharing is deferred until an authorization model is approved ([AGENTS.md](./AGENTS.md:46)). Any live-sharing decision must therefore introduce a narrow exception to that invariant and be recorded in `AGENTS.md`, `DECISIONS.md`, and `API_DESIGN.md` before implementation.

## Architectural options

| Option | Behavior | Authorization model | Main tradeoff |
|---|---|---|---|
| 1. Keep sharing deferred | Owner-only collections | Existing `ownerId` checks | Safest and smallest; no sharing |
| 2. Snapshot/copy | Recipient receives an independent copy | Ownership transfers only to the copy | Simple security; changes do not synchronize |
| 3. Read-only collection ACL | Named recipients see a live collection | Owner or explicit collection grant | Best minimal live-sharing model |
| 4. Role-based collection ACL | Recipients can view or edit | `VIEWER`/`EDITOR` grants | Supports collaboration but greatly expands authorization complexity |
| 5. Capability link | Anyone holding a secret link can view | Bearer token, optionally plus Auth0 | Easy distribution; weaker identity and forwarding controls |

### Option 1 — Keep sharing deferred

Continue enforcing `collection.ownerId === currentPerson.id` everywhere.

- No schema, endpoint, UI, or privacy-rule changes.
- Complete the required private bookmark manager first.
- Best fit for the current take-home scope, where sharing is optional and no backend exists yet.

This is my overall recommendation unless sharing is a required deliverable.

### Option 2 — Snapshot/copy

Sharing creates a copy owned by the recipient. After acceptance, the two collections are unrelated.

- Recipient can change or delete their copy without affecting the sender.
- No ongoing cross-user authorization checks.
- Avoids shared editing, revocation, inherited permissions, and concurrent updates.
- Requires a secure handoff mechanism and a decision about whether bookmark notes are included.

Choose this if “share” means “send someone this set of bookmarks,” not ongoing collaboration.

### Option 3 — Explicit read-only ACL

Add a collection-level grant such as:

```text
CollectionShare
- collectionId
- granteePersonId
- unique(collectionId, granteePersonId)
```

No role column is needed while every grant is read-only.

Authorization:

- Owner: read, update, delete, manage grants, and manage bookmarks.
- Grantee: list and read the collection and its bookmarks.
- Everyone else: receives the same generic `404` as for a nonexistent resource.
- Uncategorized bookmarks remain owner-only.
- Bookmark access is inherited from its current collection; moving it out immediately removes recipient access.
- Deleting the collection removes its grants, while the approved deletion rule preserves its bookmarks as private, uncategorized owner data.

This is my recommendation if live sharing must be implemented. It adds one relationship and one shared-access predicate without introducing speculative roles.

### Option 4 — Role-based ACL

Add a grant with `VIEWER` and `EDITOR` roles. The owner remains the only principal allowed to share, revoke access, transfer ownership, or delete the collection.

This requires additional decisions:

- Whether editors may create and delete bookmarks.
- Who owns a bookmark created by an editor.
- Whether editors may move bookmarks between collections.
- Whether activity/audit records are required.
- How concurrent edits are resolved.

It should be selected only if collaborative editing is an explicit requirement. Otherwise, the extra states and security tests are avoidable.

### Option 5 — Capability link

Create a revocable, unguessable token and expose the collection through a dedicated shared-link route.

Variants:

- Authenticated link: Auth0 login plus possession of the token.
- Public link: possession of the token alone.

The public variant conflicts most directly with the current “every route is authenticated” and “no public content” rules. Even the authenticated variant allows recipients to forward the link, so access is not tied to an approved identity. Store only a hash of the token and never expose collection IDs through failed-token behavior.

This fits link-style publishing, not controlled collaboration.

## Recipient identification choices

An ACL design also needs a separate recipient-resolution decision:

- Exact verified email: familiar UX, but must avoid revealing whether an account exists.
- Existing opaque person ID: simple backend, poor UX unless there is a safe directory.
- Single-use invitation link: avoids user enumeration and binds access after authentication, but adds invitation lifecycle and expiry.
- Auth0 organization/role: not recommended for per-collection access because resource membership changes belong in the application database, not static identity-provider roles.

For an ACL model, a single-use invitation redeemed by an authenticated recipient is the strongest design; exact verified email is the smaller implementation if pending invitations are unnecessary.

No files were changed.

> I want to investigate Option 3. I want to preserve the live-sharing capability. I do not like the idea of Owner browse the name of the Grantee, so I think the Owner should add something like an email address (like sending an email) register to that account in order to add Grantee. I want to state that since an under specified requirement state that "A user may want to share a collection with someone else." I interpreted this requirement that if grantee will only be able to see the content of the shared collection and its bookmark. A grantee may see this shared collection as a normal collection in the "Share by other" section. An Owner may revoke grantee from the collection. I also want to note that the process will be automatic. There will be no shareable link or other form of copyable output. Investigate my decision, compare it with [AGENTS.md](AGENTS.md) . Then present me with an implementation plan. Be sure to check resource structure.

<details><summary>8 previous messages</summary>

> I’m applying Ponytail to keep the live-sharing design to one read-only grant model—no roles, public links, pending invitations, or user directory unless the requirements force them. I’ll inspect the repository and current contract first, especially how identity and resources are presently defined.
>
> The decision is coherent with the product sentence, but it deliberately changes the current invariant from “creator-only” to “private unless the owner explicitly grants read access.” The repository has only policy/document files—no NestJS, Prisma, React, routes, or tests yet—so the implementation plan must define the future resource contract rather than adapt existing code.
>
> Three choices still materially affect that contract: who is eligible by email, what the owner learns from a failed address, and how owned/shared collections are listed.
>
> “Registered account” can mean three different things in this architecture:
>
> - Previously signed in: Auth0 has authenticated the person at least once, so the app already has a local `Person` row containing a stable Auth0 subject and verified email. Sharing is immediate. An Auth0 user who has never opened this app receives the selected generic `404`.
> - Any Auth0 account: the backend searches the Auth0 tenant by exact email. This reaches never-before-seen users, but requires a new machine-to-machine Auth0 client, Management API secret, token handling, rate-limit/error handling, and privileged directory access.
> - Pending until login: the app stores the submitted email without knowing whether an account exists, then binds the grant after a future verified login. This remains automatic and link-free, but it conflicts with the selected `404` behavior because the backend cannot honestly know that the email is unknown.
>
> Given the current public-SPA design explicitly avoids client secrets, “previously signed-in users” is the consistent minimal choice.
>
> One identity detail affects feasibility: the API must learn a verified email without trusting request data. I’m checking Auth0’s official token/UserInfo behavior before fixing that data flow in the plan.
>
> <details><summary>Searched the web</summary>
>
> Searched the web for `site:auth0.com/docs secure user email verified userinfo access token OpenID Connect email scope ...`
>
> </details>
>
> Auth0’s official contract supports the minimal identity flow: the custom-API access token can call `/userinfo` when `openid profile email` was requested, and that response includes `email`/`email_verified`; the API token itself normally contains only `sub`. The backend can therefore establish the local email without trusting the SPA or adding Management API credentials. [Auth0 UserInfo](https://auth0.com/docs/api/authentication/user-profile/get-user-info), [Auth0 access-token behavior](https://auth0.com/docs/secure/tokens/access-tokens)
>
> The remaining choices concern grant identity and owner management, not repository facts.
>
> There is one scope blocker from the repository structure: `backend/` and `frontend/` contain only their `AGENTS.md` files. Sharing depends on authentication, `Person`, `Collection`, `Bookmark`, CRUD routes, and the collections UI, none of which exists. The root rules also say optional bonuses must wait until all core requirements pass.
>
> I need to lock whether this is a feature plan for the post-core architecture or a plan to build the missing core application as well.
>
> Plan
>
> # Document the read-only live-sharing architecture
>
> ## Summary
>
> Approve email-addressed, live, read-only collection sharing as a narrow exception to creator-only privacy. This phase changes documentation and agent rules only; application code, migrations, UI, and automated tests remain deferred until the private core application passes its gates.
>
> ## Contract and resource design
>
> - Define `CollectionShare` with `id`, `collectionId`, `granteePersonId`, and `createdAt`; enforce one grant per collection/person. Do not add roles, pending invitations, links, copies, or notifications.
> - Use a normalized verified email only to resolve exactly one previously signed-in local `Person`; store authorization by stable person ID so later email changes do not revoke access.
> - Establish verified local email through Auth0 `/userinfo`, matching its `sub` to the verified access-token principal. Never trust an email supplied by the SPA as identity. [Auth0 UserInfo contract](https://auth0.com/docs/api/authentication/user-profile/get-user-info)
> - Grant recipients read-only access to the collection, its nested bookmark list, and direct reads of bookmarks currently in that collection. Keep all collection, bookmark, and share mutations owner-only.
> - Keep uncategorized bookmarks and the default bookmark list owner-only. Shared responses expose collection/bookmark content and `access: "viewer"`, but no owner profile.
>
> ## Public API documentation
>
> - `POST /collections/:id/shares` with `{ "email": string }`: `201` for a new grant and `200` with the existing grant for an idempotent repeat.
> - Reject malformed email or self-sharing with `400`; return the same generic `404` for an unavailable collection or an email matching zero, multiple, or no verified local accounts.
> - `GET /collections/:id/shares`: owner-only list containing share ID, current granted email, and creation time; no names, search, or account directory.
> - `DELETE /collections/:id/shares/:shareId`: owner-only revocation with `204`; unavailable grants use the generic `404`.
> - `GET /collections` remains owned-only by default; `?scope=shared` returns the authenticated grantee’s live shared collections for the “Shared by others” section.
> - Owner-or-grantee reads use one shared authorization predicate across direct, filtered, and nested paths. Unauthorized access and all grantee mutation attempts return the same generic `404` as nonexistent resources.
> - Collection deletion atomically removes its grants while preserving its bookmarks as private, uncategorized owner data.
>
> ## Documentation changes
>
> - Amend the root and directory-specific `AGENTS.md` rules so privacy remains the default, explicit read-only collection grants are the only cross-user exception, and writes remain owner-only.
> - Add an accepted ADR to `DECISIONS.md` covering the chosen model, rejected links/copies/roles, automatic exact-email sharing, stable account binding, and the absence of user browsing.
> - Expand `API_DESIGN.md` with the resource relationship, endpoint/status contract, email resolution, visibility rules, revocation, deletion interaction, and uniform non-disclosure behavior.
> - Leave `README.md` and `AI_WORKFLOW.md` unchanged because no functionality or executable review has occurred.
>
> ## Verification
>
> - Run `git diff --check` and cross-document searches to confirm the three policy sources agree.
> - Record future acceptance scenarios: successful and repeated grants, unknown/unverified/ambiguous email, self-share, owner grant listing, shared collection/bookmark reads, mutation denial, outsider non-disclosure, revocation, email change, and collection deletion.
> - Do not claim runtime or security-test coverage until application code exists.
>
> ## Assumptions
>
> - “Automatic” means access begins immediately for a uniquely matched, verified user who has previously signed into this application.
> - Owners may see only the exact emails already granted on their own collection.
> - Email matching trims whitespace and compares lowercase values without provider-specific rewriting.
> - Exact error-envelope JSON remains governed by the future global API error-shape decision; this decision fixes the status and non-disclosure behavior.
</details>

> PLEASE IMPLEMENT THIS PLAN:
> # Document the read-only live-sharing architecture
>
> ## Summary
>
> Approve email-addressed, live, read-only collection sharing as a narrow exception to creator-only privacy. This phase changes documentation and agent rules only; application code, migrations, UI, and automated tests remain deferred until the private core application passes its gates.
>
> ## Contract and resource design
>
> - Define `CollectionShare` with `id`, `collectionId`, `granteePersonId`, and `createdAt`; enforce one grant per collection/person. Do not add roles, pending invitations, links, copies, or notifications.
> - Use a normalized verified email only to resolve exactly one previously signed-in local `Person`; store authorization by stable person ID so later email changes do not revoke access.
> - Establish verified local email through Auth0 `/userinfo`, matching its `sub` to the verified access-token principal. Never trust an email supplied by the SPA as identity. [Auth0 UserInfo contract](https://auth0.com/docs/api/authentication/user-profile/get-user-info)
> - Grant recipients read-only access to the collection, its nested bookmark list, and direct reads of bookmarks currently in that collection. Keep all collection, bookmark, and share mutations owner-only.
> - Keep uncategorized bookmarks and the default bookmark list owner-only. Shared responses expose collection/bookmark content and `access: "viewer"`, but no owner profile.
>
> ## Public API documentation
>
> - `POST /collections/:id/shares` with `{ "email": string }`: `201` for a new grant and `200` with the existing grant for an idempotent repeat.
> - Reject malformed email or self-sharing with `400`; return the same generic `404` for an unavailable collection or an email matching zero, multiple, or no verified local accounts.
> - `GET /collections/:id/shares`: owner-only list containing share ID, current granted email, and creation time; no names, search, or account directory.
> - `DELETE /collections/:id/shares/:shareId`: owner-only revocation with `204`; unavailable grants use the generic `404`.
> - `GET /collections` remains owned-only by default; `?scope=shared` returns the authenticated grantee’s live shared collections for the “Shared by others” section.
> - Owner-or-grantee reads use one shared authorization predicate across direct, filtered, and nested paths. Unauthorized access and all grantee mutation attempts return the same generic `404` as nonexistent resources.
> - Collection deletion atomically removes its grants while preserving its bookmarks as private, uncategorized owner data.
>
> ## Documentation changes
>
> - Amend the root and directory-specific `AGENTS.md` rules so privacy remains the default, explicit read-only collection grants are the only cross-user exception, and writes remain owner-only.
> - Add an accepted ADR to `DECISIONS.md` covering the chosen model, rejected links/copies/roles, automatic exact-email sharing, stable account binding, and the absence of user browsing.
> - Expand `API_DESIGN.md` with the resource relationship, endpoint/status contract, email resolution, visibility rules, revocation, deletion interaction, and uniform non-disclosure behavior.
> - Leave `README.md` and `AI_WORKFLOW.md` unchanged because no functionality or executable review has occurred.
>
> ## Verification
>
> - Run `git diff --check` and cross-document searches to confirm the three policy sources agree.
> - Record future acceptance scenarios: successful and repeated grants, unknown/unverified/ambiguous email, self-share, owner grant listing, shared collection/bookmark reads, mutation denial, outsider non-disclosure, revocation, email change, and collection deletion.
> - Do not claim runtime or security-test coverage until application code exists.
>
> ## Assumptions
>
> - “Automatic” means access begins immediately for a uniquely matched, verified user who has previously signed into this application.
> - Owners may see only the exact emails already granted on their own collection.
> - Email matching trims whitespace and compares lowercase values without provider-specific rewriting.
> - Exact error-envelope JSON remains governed by the future global API error-shape decision; this decision fixes the status and non-disclosure behavior.

<details><summary>3 previous messages</summary>

> I’m implementing only the approved policy and contract changes. Ponytail keeps this documentation pass to the five necessary files—no application scaffolding, speculative roles, or unearned workflow claims.
>
> <details><summary>Edited 5 files</summary>
>
> - Wrote `./AGENTS.md` (+20 -15)
> - Wrote `./API_DESIGN.md` (+144 -4)
> - Wrote `./DECISIONS.md` (+35 -0)
> - Wrote `./backend/AGENTS.md` (+25 -13)
> - Wrote `./frontend/AGENTS.md` (+9 -4)
>
> </details>
>
> The approved exception is now recorded across root policy, backend authorization rules, frontend scope, the ADR, and the API contract. I’m checking for contradictory creator-only/deferred-sharing language and validating the diff.
</details>

Implemented the approved documentation-only sharing architecture.

- Updated [root rules](./AGENTS.md:6), [backend rules](./backend/AGENTS.md:17), and [frontend rules](./frontend/AGENTS.md:27).
- Added the ADR in [DECISIONS.md](./DECISIONS.md:52) and full contract in [API_DESIGN.md](./API_DESIGN.md:3).
- `git diff --check` and cross-document consistency checks passed. Runtime tests were skipped because application code does not exist yet.

> Investigate the grantee side of the app. what is the intended flow of the grantee after the owner of the collection? My initial thought is that after the owner add the grantee to the collection. The grantee will see this shared collection which the grantee will have the option to accept or declined. If the grantee declined. The grantee connection to that collection will be delete. Investigate my idea and its feasibility and practicality. Then give me other option we can go with this requirement.

<details><summary>1 previous message</summary>

> I’m using Ponytail to test whether accept/decline adds necessary consent or merely creates invitation state. I’ll compare it against the approved automatic-grant contract, resource model, privacy invariant, and current repository structure before laying out viable grantee flows.
</details>

Your accept/decline idea is feasible, but it changes the approved architecture materially. The current contract makes sharing immediate, explicitly forbids pending invitations, and allows only the owner to manage grants ([DECISIONS.md](./DECISIONS.md:52), [API_DESIGN.md](./API_DESIGN.md:62)).

## Proposed grantee flow

If recipient consent is required, the clean flow is:

1. Owner enters the grantee’s exact verified email.
2. Backend creates a pending `CollectionShare`; pending status grants no collection or bookmark access.
3. Grantee sees it under “Sharing requests,” separate from “Shared by others.”
4. Grantee accepts:
   - The grant becomes active.
   - The collection moves to “Shared by others.”
   - Read-only collection and bookmark access begins.
5. Grantee declines:
   - The pending grant is deleted.
   - The collection disappears from their requests.
6. An accepted grantee should also be able to leave later, deleting their own grant.
7. The owner may revoke either pending or accepted grants.
8. Deleting the collection deletes all pending and accepted grants.

The smallest resource change would be:

```text
CollectionShare
- id
- collectionId
- granteePersonId
- acceptedAt nullable
- createdAt
```

`acceptedAt = null` means pending; a timestamp means active. This avoids a separate invitation table or status enum.

## Feasibility and practical concerns

### Access before acceptance

A pending grant must not satisfy the existing owner-or-grantee authorization predicate. Only accepted grants can authorize:

- Collection details
- Nested bookmarks
- Direct bookmark reads
- Shared filters and counts

Otherwise “accept” is cosmetic because the grantee could already access the content.

### What the request reveals

The grantee needs enough information to decide. Possible previews are:

- Collection name only: preserves the current prohibition on exposing owner identity, but the recipient may not know who sent it.
- Collection name plus owner email: better practical UX, but introduces a new approved disclosure of owner profile data.
- Generic “Someone shared a collection”: strongest privacy, weakest usability.

Collection name plus owner email is the practical choice if acceptance is adopted, but it needs explicit approval because current rules prohibit exposing owner profile data.

### Repeated invitations

Deleting a declined grant means the owner can immediately add the grantee again. That is consistent with your proposal but permits repeated unwanted requests.

Preventing this would require retaining a declined state or adding a block record. I would defer blocking unless repeated invitations become a demonstrated problem.

### Concurrent actions

Acceptance must be an atomic conditional update of a pending grant owned by the authenticated grantee. If the owner revoked the grant first, acceptance returns the generic `404`. This prevents a revoke/accept race from restoring access.

### Repository impact

This would require revising the current documentation because it conflicts with:

- “Sharing is automatic” and “no pending invitation” in [DECISIONS.md](./DECISIONS.md:64).
- Immediate active-grant behavior in [API_DESIGN.md](./API_DESIGN.md:31).
- Owner-only share management in [API_DESIGN.md](./API_DESIGN.md:64).
- The frontend’s currently approved sharing scope in [frontend/AGENTS.md](./frontend/AGENTS.md:27).

## Other viable options

### Option A — Immediate access with “Leave shared collection” — recommended

Keep the existing automatic grant. The collection immediately appears under “Shared by others,” but the grantee can remove their own access at any time.

Advantages:

- No pending state or acceptance screen.
- Only one new grantee action: leave.
- Minimal change to the approved model.
- Gives the recipient control over unwanted shared content.

Tradeoff: the grantee receives access before expressing consent.

### Option B — Explicit accept, decline, and leave

Use the pending flow described above.

Advantages:

- Clear recipient consent.
- Unwanted collections never enter the active shared list.
- Familiar invitation-style UX.

Tradeoffs:

- Adds pending state, request-list UI, grantee mutation endpoints, race handling, and sender-preview decisions.
- The owner can re-invite after decline unless another state is retained.

This is the best option if consent before disclosure is a product requirement.

### Option C — Persistent decline or block

Keep declined grants with a `DECLINED` state, or add a recipient-controlled block.

Advantages:

- Prevents repeated invitations.
- Records an explicit recipient decision.

Tradeoffs:

- Adds state transitions and retention policy.
- Requires deciding whether owners may see that they were declined.
- More machinery than the requirement currently warrants.

### Option D — Immediate access with local hide

The grantee hides the collection, but the backend grant remains active.

This is not recommended: it removes UI clutter without actually removing authorization, so “decline” would be misleading.

## Recommendation

For this take-home, keep automatic sharing and add a grantee-controlled “Leave shared collection” action. It satisfies recipient control with the smallest authorization change.

If acceptance before access is important, use the nullable `acceptedAt` model, separate pending requests from active shares, permit both decline and later leave, and explicitly decide whether the pending request exposes the owner’s email.

No files were changed.

> Let's go with Option A. It satisfied the current under-specified requirements, required minimal effort and minimal testing compared with other option.
>
> I think the user now have two type or deleting a collection. A normal delete for user's own collection, and a "Leave shared collection" for shared collection. Give me your opinion on this.

<details><summary>1 previous message</summary>

> I’m using Ponytail because this is exactly where naming and route shape can avoid inventing a second deletion system. I’ll check the approved owner-delete and share-management contracts, then assess the smallest grantee-side change.
</details>

I agree with Option A, with one important distinction: these are not two kinds of collection deletion. They are two different resource operations.

| User | Action | Deleted resource |
|---|---|---|
| Owner | Delete collection | `Collection`, all shares; bookmarks become uncategorized |
| Grantee | Leave shared collection | Only that grantee’s `CollectionShare` |

They should use separate controls and endpoints:

- Owner: `DELETE /collections/:id`
- Grantee: `DELETE /collections/:id/share`

Do not make `DELETE /collections/:id` behave differently depending on whether the caller is owner or grantee. That would be surprising and potentially dangerous.

For “Leave,” the backend should delete only the share matching both `collectionId` and the authenticated grantee’s person ID. It should never accept a grantee ID from the request. Return `204 No Content` even if the grant has already disappeared, making retries safe and avoiding collection-existence disclosure.

After leaving:

- The collection disappears from “Shared by others.”
- All subsequent direct, filtered, and nested reads return the generic `404`.
- The owner’s collection and bookmarks remain unchanged.
- Other grantees remain connected.
- The owner may share it with the same person again later; no blocking or decline history is added.

The UI should label the action “Leave shared collection,” with confirmation explaining that it only removes the user’s access. Shared collections must never display the owner’s “Delete collection” control.

This is substantially simpler than accept/decline: no pending state, invitation list, transitions, or acceptance races. It needs one relationship-delete path and focused tests for self-removal, preserved owner data, preserved other grantees, and lost access afterward.

It will require a narrow update to the current contract because [AGENTS.md](./AGENTS.md:11) and [API_DESIGN.md](./API_DESIGN.md:64) presently reserve all share management for the owner. No files were changed.

> Please proceed. And record decision in [DECISIONS.md](DECISIONS.md) along with my opinion

<details><summary>2 previous messages</summary>

> I’m using Ponytail to keep this to the smallest coherent contract change: document one grantee-owned relationship deletion, without adding invitation state, blocking, or a second collection-deletion behavior. I’ll verify the current decision and policy text before producing the implementation-ready documentation plan.
>
> Plan
>
> # Document grantee-controlled leave behavior
>
> ## Summary
>
> Extend the automatic read-only sharing model with a grantee-controlled “Leave shared collection” action. This deletes only the authenticated grantee’s `CollectionShare`; it is explicitly distinct from the owner’s collection deletion.
>
> ## Contract and documentation changes
>
> - Add a dated ADR to `DECISIONS.md` recording the user’s preference for Option A because it satisfies the requirement with less state, implementation effort, and testing than accept/decline.
> - Define two separate actions:
>   - Owner `DELETE /collections/:id`: deletes the collection and shares while preserving bookmarks as uncategorized.
>   - Grantee `DELETE /collections/:id/share`: deletes only the caller’s grant.
> - Make the leave endpoint idempotent and non-disclosing: return `204 No Content` whether the caller’s grant existed or not; never accept a grantee/share ID or affect another grant.
> - After leaving, remove the collection from `scope=shared` and return generic `404` for subsequent direct, filtered, and nested reads.
> - Permit the owner to grant access to the same person again later; add no block, decline history, pending state, or notification.
> - Update root/backend/frontend `AGENTS.md` rules so owner-only share management has one narrow exception: a grantee may delete their own grant.
> - Leave `README.md` and `AI_WORKFLOW.md` unchanged because no application behavior exists yet.
>
> ## Future UI and tests
>
> - Owners see “Delete collection” and never “Leave”; viewers see “Leave shared collection” and never “Delete.”
> - Confirm leaving with text that only access is removed and the owner’s collection/bookmarks are unaffected.
> - Record future tests proving leave removes only the caller’s grant, preserves owner data and other grantees, removes all subsequent access, is safely repeatable, permits later re-sharing, and does not change owner-delete behavior.
>
> ## Verification and assumptions
>
> - Run `git diff --check` and cross-document searches for contradictory owner-only share-management language.
> - No runtime tests are possible because `backend/` and `frontend/` currently contain no application code.
> - “Leave” is relationship deletion, never a second form of collection deletion.
</details>

> PLEASE IMPLEMENT THIS PLAN:
> # Document grantee-controlled leave behavior
>
> ## Summary
>
> Extend the automatic read-only sharing model with a grantee-controlled “Leave shared collection” action. This deletes only the authenticated grantee’s `CollectionShare`; it is explicitly distinct from the owner’s collection deletion.
>
> ## Contract and documentation changes
>
> - Add a dated ADR to `DECISIONS.md` recording the user’s preference for Option A because it satisfies the requirement with less state, implementation effort, and testing than accept/decline.
> - Define two separate actions:
>   - Owner `DELETE /collections/:id`: deletes the collection and shares while preserving bookmarks as uncategorized.
>   - Grantee `DELETE /collections/:id/share`: deletes only the caller’s grant.
> - Make the leave endpoint idempotent and non-disclosing: return `204 No Content` whether the caller’s grant existed or not; never accept a grantee/share ID or affect another grant.
> - After leaving, remove the collection from `scope=shared` and return generic `404` for subsequent direct, filtered, and nested reads.
> - Permit the owner to grant access to the same person again later; add no block, decline history, pending state, or notification.
> - Update root/backend/frontend `AGENTS.md` rules so owner-only share management has one narrow exception: a grantee may delete their own grant.
> - Leave `README.md` and `AI_WORKFLOW.md` unchanged because no application behavior exists yet.
>
> ## Future UI and tests
>
> - Owners see “Delete collection” and never “Leave”; viewers see “Leave shared collection” and never “Delete.”
> - Confirm leaving with text that only access is removed and the owner’s collection/bookmarks are unaffected.
> - Record future tests proving leave removes only the caller’s grant, preserves owner data and other grantees, removes all subsequent access, is safely repeatable, permits later re-sharing, and does not change owner-delete behavior.
>
> ## Verification and assumptions
>
> - Run `git diff --check` and cross-document searches for contradictory owner-only share-management language.
> - No runtime tests are possible because `backend/` and `frontend/` currently contain no application code.
> - “Leave” is relationship deletion, never a second form of collection deletion.

<details><summary>3 previous messages</summary>

> I’ll apply the approved documentation-only refinement across the existing ADR, API contract, and agent rules. Ponytail keeps the model unchanged: one existing share row, one self-removal route, and no invitation or blocking state.
>
> <details><summary>Edited 5 files</summary>
>
> - Wrote `./AGENTS.md` (+5 -3)
> - Wrote `./API_DESIGN.md` (+32 -5)
> - Wrote `./DECISIONS.md` (+31 -0)
> - Wrote `./backend/AGENTS.md` (+7 -4)
> - Wrote `./frontend/AGENTS.md` (+6 -3)
>
> </details>
>
> The decision and contract now distinguish owner deletion from grantee self-removal. I’m validating that no document still says all share management is owner-only and that the leave route remains non-disclosing and relationship-only.
</details>

Implemented the grantee leave decision.

- Recorded your rationale in [DECISIONS.md](./DECISIONS.md:87).
- Defined idempotent `DELETE /collections/:id/share` behavior in [API_DESIGN.md](./API_DESIGN.md:116) and aligned all agent rules.
- `git diff --check` and consistency searches passed. Runtime tests remain deferred because no application code exists.

> Explain bookmark behavior inside owner collection and shared collection.

<details><summary>1 previous message</summary>

> I’m using Ponytail to explain the behavior as a small set of ownership and access rules, based on the documented contract rather than adding new bookmark semantics.
</details>

A shared collection is not a copy. It is the owner’s normal collection with an additional read permission for each grantee. The bookmarks remain owned and controlled by the collection owner.

| Behavior | Owner | Grantee |
|---|---|---|
| View collection/bookmarks | Yes | Yes, while share is active |
| Create bookmarks in collection | Yes | No |
| Edit bookmark | Yes | No |
| Move bookmark | Yes, to another owned collection or uncategorized | No |
| Delete bookmark | Yes | No |
| Delete collection | Yes | No |
| Leave shared collection | Not applicable | Yes |
| Reshare collection | Yes | No |

### Owner behavior

The owner can manage bookmarks normally, whether or not the collection is shared:

- Adding a bookmark makes it immediately visible to all active grantees.
- Editing a bookmark updates what grantees see.
- Moving a bookmark out of the shared collection immediately removes grantee access to it.
- Moving an owned bookmark into the shared collection makes it visible to its grantees.
- Deleting a bookmark removes it for everyone.
- The owner cannot place a bookmark into another person’s collection, even when they are a grantee of it.

If the owner deletes the collection, its bookmarks are preserved as private, uncategorized bookmarks, while every share is removed. See [API_DESIGN.md](./API_DESIGN.md:135).

### Grantee behavior

A grantee receives live, read-only access:

- The collection appears under “Shared by others.”
- Its current bookmarks can be read through the collection, a collection filter, or direct bookmark access.
- Shared bookmarks do not appear in the grantee’s normal unfiltered bookmark list.
- Responses carry `access: "viewer"` so the UI can render them read-only.
- The owner’s identity and other private content are not exposed.

Any attempt to create, edit, move, or delete a bookmark returns the same generic `404` as a nonexistent resource. These rules are defined in [API_DESIGN.md](./API_DESIGN.md:38).

### When access ends

A grantee loses bookmark access immediately when:

- The owner revokes their share.
- The grantee leaves the collection.
- The owner deletes the collection.
- The owner moves a bookmark outside that collection.
- The owner deletes the bookmark.

Leaving removes only that grantee’s `CollectionShare`; it never changes the collection or any bookmark. Other grantees remain unaffected.
