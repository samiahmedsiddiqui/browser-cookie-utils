# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - Modernized Cookie API + Dual Minified Builds

### ⚠️ Breaking Changes

- `setCookie` and `deleteCookie` now use **options object**
- Positional arguments from v1.x are no longer supported

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

## [1.0.0] - Initial Release

- Initial release of **browser-cookie-utils**
- `getCookie`, `setCookie`, `deleteCookie` helpers
- Time-based expiration (`hour`, `day`, `month`)
- Multi-domain cookie support
- Secure cookies on HTTPS
