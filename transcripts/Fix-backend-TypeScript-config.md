# Fix backend TypeScript config

> Address error in [tsconfig.json](backend/tsconfig.json)
>
>     "outDir": "./dist",
>     "baseUrl": "./"
>
> The common source directory of 'tsconfig.json' is './src'. The 'rootDir' setting must be explicitly set to this or another path to adjust your output's file layout.
>   Visit https://aka.ms/ts6 for migration information.
>
> Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
>   Visit https://aka.ms/ts6 for migration information.

<details><summary>1 previous message</summary>

> I’m using the Ponytail coding skill here: I’ll trace the backend TypeScript config and build inputs, then propose the smallest config-only fix and checks. Repository rules require your approval of that plan before I edit.
</details>

Plan awaiting approval:

- In [backend/tsconfig.json](./backend/tsconfig.json), add `"rootDir": "./src"` and remove unused deprecated `"baseUrl"`.
- Security impact: none. Documentation impact: none.
- Verify under Node 22.22.0 with backend typecheck/build/tests, then `npm run check`.

Approve this plan and I’ll apply it.

> approve

<details><summary>5 previous messages</summary>

> Approved. Ponytail keeps this to the two compiler-config changes—explicit source root and deletion of the unused deprecated option—then I’ll run the agreed checks.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./backend/tsconfig.json` (+1 -1)
>
> </details>
>
> The config typecheck passes. The backend test process is still running beyond its initial output window, so I’m checking its completion before starting the build and full gate.
>
> The first test rerun exposed the repository’s documented shell-runtime trap: npm itself used Node 22, but its lifecycle subprocess resolved the shell’s Node 24 and produced the known Prisma `500`s. I’m rerunning with Node 22 placed on the entire process PATH; no code change is warranted.
>
> Focused verification now passes: backend typecheck, all 28 tests, and production build. I’m running the repository-wide gate to catch any workspace interaction.
</details>

Updated [backend/tsconfig.json](./backend/tsconfig.json): added `"rootDir": "./src"` and removed deprecated, unused `"baseUrl"`.

`npm run check` passes under Node 22.22.0: lint, typechecks, 41 tests, and builds. Initial test attempt hit the documented Node 24 Prisma mismatch; Node 22 rerun passed.
