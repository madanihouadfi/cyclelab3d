# RULES: for the builder agent

Read this file at the start of every task. These rules always apply.

## Working rules

1. Read `docs/SPEC.md`, `docs/RULES.md` and `docs/PROGRESS.md` before anything else.
2. Work on **one module only**. Never start another module. Never add features that are not in the module scope.
3. **Plan first, code later.** Show the plan and wait for approval.
4. The user is a beginner at coding. Explain in simple words, in short steps.
5. Show every terminal command before running it. Do not run destructive commands (`rm -rf`, `git reset --hard`, `git push --force`) without explicit approval.
6. Ask before installing any new package. Say what it is and why it is needed.
7. Make the smallest change that solves the problem. Do not rewrite files that work.
8. If you are unsure, ask. Do not guess physics values or formulas.

## Physics rules (most important)

1. All physics code lives in `src/thermo/`. It has **no UI code** in it.
2. Use SI units everywhere: K, kPa, kJ/kg, kJ/(kg·K), MW. Write the unit in every variable name or comment.
3. Every formula gets a unit test with a known textbook value. Write the source (book, chapter, example number) in a comment.
4. Never type a result by hand in the UI. Every displayed number comes from the physics code.
5. If a result looks impossible (negative power, efficiency above 100%, temperature crossing in the HRSG), the code must return a clear error, not a wrong number.
6. Do not change a formula or a default value without telling the user and updating `docs/SPEC.md`.

## Code rules

1. Language: TypeScript, strict mode. Code, comments and file names in English.
2. No hard-coded user text in components. All text goes through the EN and FR dictionaries.
3. Small files, clear names. One component per file.
4. Run lint, type-check, tests and the production build before saying a task is done.
5. 3D: only our own simple shapes. Do not download models or textures with unclear licenses.

## Security rules

1. Never ask for, store or print secret keys, passwords or tokens.
2. Never put secrets in the code or in Git.
3. Use only npm packages approved by the user. Keep the lock file.
4. No external scripts or tracking.

## Git rules

1. One module = one commit (or a few clear commits) and one tag, for example `m1`, `m2`, `m3a`.
2. Commit only after the user says everything works.
3. Never push to a remote without approval.

## Definition of done for a module

- All acceptance criteria in `docs/SPEC.md` for this module are met.
- Lint, type-check, tests and build pass.
- The app was opened in the browser and checked in English and French, and on a phone-size window when the module touches the UI.
- `docs/PROGRESS.md` is updated (status, tool and model used, tag, decisions, known issues).
- Reply ends with: what was done in 5 lines, manual test steps for the user, and "Do not start another module" confirmed.
