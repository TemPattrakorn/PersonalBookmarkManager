# Review schema compatibility rules

> Go over "schema changes, destructive data behavior, or compatibility breaks" Under-specified requirements in [AGENTS.md](AGENTS.md)

This means: if a request affects stored data or API expectations but doesn’t spell out the rules, stop and get a decision before implementing.

- Schema changes: new/changed fields, constraints, migrations, indexes, or relations.
- Destructive data behavior: deletion, cascade/orphan behavior, irreversible transforms, or data loss on updates.
- Compatibility breaks: changing endpoints, payloads, defaults, status/error behavior, or anything existing clients/data depend on.

For this app, examples include “delete a collection” (delete bookmarks, uncategorize them, or reject?) and “make `url` required” (what happens to existing rows?). Present viable options, recommend one, then wait for approval.
