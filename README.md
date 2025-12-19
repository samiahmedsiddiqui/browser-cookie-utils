# browser-cookie-utils

[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Build][build-image]][build-url]
[![Downloads][jsdelivr-image]][jsdelivr-url]

Lightweight, dependency-free JavaScript helpers for getting, setting, and deleting browser cookies safely and consistently.

## Features

- Zero runtime dependencies
- Browser-only (no Node.js required in production)
- Cookie expiration with time units
- Multi-domain cookie support
- Secure cookies on HTTPS
- Minified build for production

---

## Installation

### Option 1: Download / Copy

```html
<script src="dist/browser-cookie-utils.min.js"></script>
```

### Option 2: NPM

```bash
npm install browser-cookie-utils
```

### Option 3: jsDelivr CDN

#### Latest version:

```html
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils/dist/browser-cookie-utils.min.js"></script>
```

#### Specific version:

```html
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils/dist/browser-cookie-utils.min.js"></script>
```

> **Note:** The library attaches itself to window.browserCookieUtils in the browser.

## Usage

### Set a cookie

```js
browserCookieUtils.setCookie('theme', 'dark');
```

### With expiration

```js
browserCookieUtils.setCookie('session', 'abc123', 2, 'hour');
browserCookieUtils.setCookie('promo', 'active', 7, 'day');
```

Supported units: `hour`, `day`, `month`.

### Set cookie for specific domains

```js
browserCookieUtils.setCookie(
  'username',
  'sami',
  1,
  'day',
  ['.example.com', '.example.org']
);
```

## Get a cookie

```js
const theme = browserCookieUtils.getCookie('theme');
```

Returns `string` if found, `null` if not.

## Delete a cookie

```js
browserCookieUtils.deleteCookie('theme');
```

### Delete from specific domains

```js
browserCookieUtils.deleteCookie('username', ['.example.com']);
```

## Security behavior

- Adds Secure automatically on HTTPS
- Uses encodeURIComponent / decodeURIComponent
- Sets path=/ by default
- Does not set HttpOnly

## License

MIT © [Sami Ahmed Siddiqui](https://github.com/samiahmedsiddiqui)

[build-image]:https://img.shields.io/github/actions/workflow/status/samiahmedsiddiqui/browser-cookie-utils/ci.yml
[build-url]: https://github.com/samiahmedsiddiqui/browser-cookie-utils/actions

[npm-image]: https://img.shields.io/npm/v/browser-cookie-utils.svg
[npm-url]: https://www.npmjs.com/package/browser-cookie-utils

[license-image]: https://img.shields.io/badge/License-MIT-green.svg
[license-url]: LICENSE

[jsdelivr-image]: https://img.shields.io/jsdelivr/npm/hm/browser-cookie-utils
[jsdelivr-url]: https://www.jsdelivr.com/package/npm/browser-cookie-utils
