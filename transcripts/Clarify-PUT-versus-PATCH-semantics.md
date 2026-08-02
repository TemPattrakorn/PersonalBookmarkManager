# Clarify PUT versus PATCH semantics

> Go over "`PUT` versus `PATCH` semantics" Under-specified requirements in [AGENTS.md](AGENTS.md)

<details><summary>1 previous message</summary>

> I’ll compare the repository’s approved API contract with the ambiguity flag in `AGENTS.md`, so the distinction is concrete rather than generic.
</details>

`API_DESIGN.md` currently authorizes owner-only “update, patch,” but defines neither route’s payload semantics. That is intentionally under-specified.

- `PUT /resource/:id` normally replaces the full editable representation. The contract must say whether omitted fields are rejected, reset, or preserved.
- `PATCH /resource/:id` changes only supplied fields. The contract must define clearing (`null`), validation of partial payloads, and whether it uses JSON Merge Patch or a simple explicit partial body.
- Supporting both without distinct rules is needless ambiguity and can cause accidental data loss.

Recommendation: expose only `PATCH` for collection/bookmark edits, with a documented partial JSON body; omitted fields remain unchanged and `collectionId: null` explicitly uncategorizes a bookmark. Use owner-scoped lookup before updating, returning the same generic `404` for outsiders.

No files changed.

> Go with your recommendation.

<details><summary>3 previous messages</summary>

> I’m using the repository’s minimal-change convention: record the approved API decision only—`PATCH` for partial owner edits, no `PUT`—without creating implementation work that wasn’t requested.
>
> Plan approved by your choice: add one ADR and one API contract section. It will make `PATCH` the sole update verb, preserve omitted fields, reserve `collectionId: null` for uncategorizing, and keep malformed/outsider updates non-disclosing; no runtime code or dependencies.
>
> <details><summary>Edited 2 files</summary>
>
> - Wrote `./API_DESIGN.md` (+16 -1)
> - Wrote `./DECISIONS.md` (+21 -0)
>
> </details>
</details>

Recorded the approved `PATCH`-only contract in [API_DESIGN.md](./API_DESIGN.md:62) and [DECISIONS.md](./DECISIONS.md:109).

Validated with `git diff --check`. Skipped implementation and tests: this is documentation-only.
