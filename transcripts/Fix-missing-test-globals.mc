# Fix missing test globals

> got error in vs code
>
> Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig.
>
> Cannot find name 'it'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig.
>
> Cannot find name 'expect'.

<details><summary>1 previous message</summary>

> I’m using the project’s minimal-change workflow to identify the configured test runner and TypeScript setup before suggesting a fix. I’ll keep this to the smallest type-resolution change.
</details>

The backend already has Jest types installed, and `npm run typecheck --workspace backend` passes. Don’t add another test package.

In VS Code:

1. Run **TypeScript: Restart TS Server**.
2. If it persists, run **Developer: Reload Window**.
3. Open the repository root (`PersonalBookmarkManager`), not just `backend/src`.

`backend/package.json` already includes `@types/jest`; TypeScript discovers it automatically.
