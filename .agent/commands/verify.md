# Verify the repository

Use this command before handing off an implementation change.

1. Select the required Node version with `nvm use` or otherwise confirm Node
   22.22.0 and npm 10.9.4.
2. Run `npm run check` from the repository root.
3. Run `git diff --check`.
4. Inspect `git status --short` and confirm no `.env`, SQLite database,
   generated Prisma client, `node_modules`, coverage, or build output is
   tracked.
5. Report the commands that ran, all failures and recoveries, and any skipped
   checks. Never claim a check that did not run.
