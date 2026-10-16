# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Docs tooling: VitePress now runs on a patched Vite 6 (npm `overrides`), which clears the dev-only Vite and esbuild advisories. The published package is unaffected.
- `repository.url` in `package.json` uses the `git+https` form npm expects.

## [2.1.0] - Oct 16, 2026

### Security

- `sameSite` only accepts `Lax`, `Strict` or `None`. Other strings could inject attributes such as `path` or `max-age`.
- Glob patterns are matched with a linear-time matcher. The previous RegExp conversion could freeze the page on long cookie names (ReDoS).
- `path` and `domains` are validated. Unsafe paths are refused, and invalid domains are skipped instead of falling back to a host-only cookie.
- `getJSONCookie` drops `__proto__` keys to prevent prototype changes when the result is merged.

### Fixed

- `createCookieUtils`: a per-call option set to `undefined` no longer overrides the default.
- `unit` values like `constructor` and non-finite or huge `timeToLive` values no longer produce invalid `max-age` values (which browsers turned into session cookies). Lifetimes are capped at 400 days.
- `deleteCookies` also tries paths with a trailing slash.
- `deleteCookie` without `domains` also removes the host-only cookie.
- `partitioned: true` defaults `sameSite` to `None`, which cross-site embeds need.
- CommonJS builds are now emitted as `.cjs` files. Previously `require('browser-cookie-utils')` returned an empty object in Node because the package is `"type": "module"`.
- `getCookie` no longer throws when a cookie value isn't valid URI encoding; the raw value is returned.
- `setCookie` / `deleteCookie` no longer set an invalid `domain` attribute on `localhost` or IP addresses, which made browsers drop the cookie.
- `SameSite=None` now always adds `Secure`, as browsers require.
- An unknown `unit` now falls back to `hour` (the documented default) instead of creating a session cookie.
- `deleteCookie` also sets an `expires` date in the past for older browsers.
- Removed the duplicate `'use strict'` from the CJS build.

### Added

- Real-browser tests (Playwright: Chromium, Firefox, WebKit) run in CI with `npm run test:browser`. They check what browsers actually store: domains, paths, `Secure`, `SameSite`, prefixes, partitioned cookies, size and expiry limits.
- `createCookieUtils(defaults)` returns the helpers with default options and an optional `namePrefix`.
- `setCookie` and `setJSONCookie` return `true` if the cookie can be read back afterwards; `deleteCookie` returns `true` if the cookie is gone.
- `partitioned` option on `setCookie`, `deleteCookie` and `deleteCookies` adds the `Partitioned` (CHIPS) attribute and forces `Secure`.
- Cookie prefix rules: `__Secure-` cookies always get `Secure`; `__Host-` cookies always get `Secure`, `path=/` and no `domain`.
- New `unit` values: `second`, `minute`, `week` and `year` (365 days).
- `expires` option for an exact expiry `Date`, and `session` option for session cookies.
- `setJSONCookie(name, value, options)` and `getJSONCookie(name)` store and read JSON values.
- `hasCookie(name)` checks whether a cookie exists, even if its value is empty.
- `getAllCookies()` returns every cookie as an object of name → decoded value.
- `getCookies(pattern)` returns the cookies whose name matches a glob (`*`, `?`), RegExp or predicate.
- `deleteCookies(pattern, options)` deletes every cookie whose name matches a glob (`*`, `?`), RegExp or predicate, and returns the names it couldn't delete.
- TypeScript declarations (`.d.ts` / `.d.cts`).
- `exports` entries for `./umd` and `./package.json`, plus `unpkg` / `jsdelivr` fields.
- Helpers are no-ops (instead of throwing) when `document` isn't available, e.g. during SSR.
- Cookie names are validated; invalid names are ignored.
- Unit tests (`npm test`) and a `prepublishOnly` check.

### Changed

Behavior changes to check when upgrading from 2.0.x:

- CommonJS files were renamed to `browser-cookie-utils.cjs` / `.min.cjs`. Imports through the package name are unaffected; only direct `dist/*.cjs.js` paths need updating.
- Invalid cookie names (spaces, `;`, `=`, …) are ignored instead of written.
- An unknown `unit` now falls back to `hour` instead of creating a session cookie.
- Unsafe `path` values and invalid `domains` are no longer written; `setCookie` returns `false`.
- `deleteCookie` without `domains` also removes the host-only cookie (two writes instead of one).
- `setCookie` and `deleteCookie` return a `boolean` instead of `undefined`.

Project:

- Documentation site: https://samiahmedsiddiqui.github.io/browser-cookie-utils/
- Real-browser tests (Chromium, Firefox, WebKit) and coverage thresholds in CI.
- CI uses `npm ci`, checks formatting instead of rewriting it, runs tests and verifies `dist` is up to date.
- README corrections (CDN version pinning, build table, deletion notes).

## [2.0.1] - Jan 21, 2026

### Fixed

- ESM exports (`getCookie`, `setCookie`, `deleteCookie`) now work correctly for modern bundlers.
- UMD build now properly exposes `browserCookieUtils` globally in the browser and supports CommonJS.
- **Fixed** build errors caused by Terser parsing `export` statements inside wrapped code.
- Updated README usage examples to reflect the correct import syntax for ESM and CommonJS.

## [2.0.0] - Jan 5, 2026

### ⚠️ Breaking Changes

- `setCookie` and `deleteCookie` now use **options object** instead of positional arguments (see migration guide in README)

### Added

- **Dual-publish minified builds**: ESM + CJS
- **UMD build** for legacy browsers / script tag & CommonJS
- Non-minified ESM and CJS builds for easier debugging
- Source maps for minified ESM
- Updated package.json `exports` field for proper module resolution

### Changed

- Build system updated for professional dual-publish workflow
- README updated with examples for ESM, CJS, and UMD usage

### Improved

- Robust Terser minification with banners and error handling
- Clearer migration guidance

## [1.0.0] - Dec 19, 2025

- Initial release of **browser-cookie-utils**
- `getCookie`, `setCookie`, `deleteCookie` helpers
- Time-based expiration (`hour`, `day`, `month`)
- Multi-domain cookie support
- Secure cookies on HTTPS
