# Contributing

## Project rules

- **Browser-only, zero runtime dependencies.** Only `devDependencies` are allowed.
- **Single source file:** `src/browser-cookie-utils.js`. Types live in `src/browser-cookie-utils.d.ts`.
- **`dist/` is committed.** Rebuild it (`npm test` does this) and commit it with every source change. CI fails if `dist/` is out of date.
- **No breaking changes** without a major version and a migration note in the README.

## Code style

- Tabs, single quotes, no trailing commas (Prettier + `.editorconfig`). Run `npm run format`.
- Syntax up to ES2019. No transpiler is used.
- Every function has a JSDoc block.
- Public functions:
  - are listed in the single `export { ... }` at the end of the source (the build reads exports from it);
  - do nothing (or return `null` / `[]`) when `document` isn't available — use `hasDocument()`;
  - validate cookie names with `isValidName()`;
  - never throw on bad input.
- Internal helpers are not exported.

## Every public API change must include

1. Types in `src/browser-cookie-utils.d.ts`
2. Tests (`node:test`, must pass on the Node version in `.nvmrc`):
   - behavior tests in `test/browser-cookie-utils.test.js`
   - **boundary tests in `test/boundaries.test.js` for every new or changed option**: the minimum and maximum accepted values, just outside both, and invalid types (`null`, `undefined`, wrong type, empty, unsafe characters)
   - coverage of `src/` must stay at 100% lines and functions and at least 98% branches; CI fails otherwise
3. A README section with an example
4. An entry under `## [Unreleased]` in `CHANGELOG.md`

## Workflow

- One feature or fix per pull request, branched from `main`.
- Branch names: `feat/...`, `fix/...`, `docs/...`, `ci/...`.
- Before pushing: `npm run lint && npm run format:check && npm run test:coverage`.
- Don't bump the version in feature PRs; releases are done separately.

## Commits

- One-line subject in the imperative mood (e.g. `Add getAllCookies`), no body.
- No AI tool names or AI attribution (`Co-Authored-By`, "Generated with ...").

## Pull requests

- Title matches the commit subject.
- Description starts with the CI status badge for the branch:

  ```md
  [![CI](https://img.shields.io/github/actions/workflow/status/samiahmedsiddiqui/browser-cookie-utils/ci.yml?branch=<branch>&label=CI)](https://github.com/samiahmedsiddiqui/browser-cookie-utils/actions/workflows/ci.yml?query=branch%3A<url-encoded-branch>)
  ```

- Then a short `## Summary` with a few bullets. No AI tool names or attribution.
