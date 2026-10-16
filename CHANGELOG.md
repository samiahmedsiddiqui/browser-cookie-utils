# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- CommonJS builds are now emitted as `.cjs` files. Previously `require('browser-cookie-utils')` returned an empty object in Node because the package is `"type": "module"`.
- `getCookie` no longer throws when a cookie value isn't valid URI encoding; the raw value is returned.
- `setCookie` / `deleteCookie` no longer set an invalid `domain` attribute on `localhost` or IP addresses, which made browsers drop the cookie.
- `SameSite=None` now always adds `Secure`, as browsers require.
- An unknown `unit` now falls back to `hour` (the documented default) instead of creating a session cookie.
- `deleteCookie` also sets an `expires` date in the past for older browsers.
- Removed the duplicate `'use strict'` from the CJS build.

### Added

- TypeScript declarations (`.d.ts` / `.d.cts`).
- `exports` entries for `./umd` and `./package.json`, plus `unpkg` / `jsdelivr` fields.
- Helpers are no-ops (instead of throwing) when `document` isn't available, e.g. during SSR.
- Cookie names are validated; invalid names are ignored.
- Unit tests (`npm test`) and a `prepublishOnly` check.

### Changed

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
