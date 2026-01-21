# Changelog

All notable changes to this project will be documented in this file.

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

## [1.0.0] - Dec 19, 25

- Initial release of **browser-cookie-utils**
- `getCookie`, `setCookie`, `deleteCookie` helpers
- Time-based expiration (`hour`, `day`, `month`)
- Multi-domain cookie support
- Secure cookies on HTTPS
