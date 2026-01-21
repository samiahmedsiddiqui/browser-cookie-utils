# browser-cookie-utils

[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Build][build-image]][build-url]
[![Downloads][jsdelivr-image]][jsdelivr-url]

Lightweight, dependency-free JavaScript helpers for getting, setting, and deleting browser cookies safely and consistently in modern browsers.

## Features

- Zero runtime dependencies
- Browser-only (no Node.js required in production)
- Simple, ergonomic API
- Cookie expiration with time units
- Multi-domain cookie support
- Automatic Secure flag on HTTPS
- SameSite support (`Lax`, `Strict`, `None`)
- Path customization
- Safe encoding / decoding

## Installation

### NPM (Modern ESM / CJS)

```sh
npm install browser-cookie-utils@2
```

#### ESM import (modern bundlers):

```js
import { setCookie, getCookie, deleteCookie } from 'browser-cookie-utils';
```

#### CJS import (Node.js / legacy bundlers):

```js
const { getCookie, setCookie, deleteCookie } = require('browser-cookie-utils');
```

### Browser (UMD / CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils/dist/browser-cookie-utils.umd.js"></script>
```

### Available Builds

| File                              | Format     | Notes                                   |
| --------------------------------- | ---------- | --------------------------------------- |
| `browser-cookie-utils.js`         | ESM        | Non-minified, modern bundlers           |
| `browser-cookie-utils.min.js`     | ESM        | Minified, production-ready (ES module)  |
| `browser-cookie-utils.cjs.js`     | CJS        | Non-minified, Node.js / CommonJS        |
| `browser-cookie-utils.cjs.min.js` | CJS        | Minified, production-ready              |
| `browser-cookie-utils.umd.js`     | UMD        | Legacy browsers / script tag & CommonJS |
| `browser-cookie-utils.min.js.map` | Source map | For minified ESM                        |

> **Note:** The library attaches itself to `window.browserCookieUtils` in the browser.

## Usage by environment

### ES Modules (recommended)

```js
import { getCookie, setCookie, deleteCookie } from 'browser-cookie-utils';

setCookie('theme', 'dark');
```

### CommonJS

```js
const { getCookie, setCookie, deleteCookie } = require('browser-cookie-utils');

setCookie('theme', 'dark');
```

### Browser (script tag / CDN)

```js
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils/dist/browser-cookie-utils.umd.js"></script>
<script>
  browserCookieUtils.setCookie('theme', 'dark');
</script>
```

> The global `browserCookieUtils` is available only when using the UMD build.

## API Usage

### Set a cookie (basic)

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('theme', 'dark');
```

Creates a cookie with:

- 1 hour expiration
- `path=/`
- `SameSite=Lax`
- `Secure` (automatically on HTTPS)

---

### Set a cookie with options

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('session', 'abc123', {
  timeToLive: 2,
  unit: 'hour'
});
```

Supported units:

- `hour`
- `day`
- `month` (30 days)

---

### Set cookie with full configuration

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('user', 'sami', {
  timeToLive: 7,
  unit: 'day',
  domains: ['example.com', '.example.org'],
  path: '/',
  sameSite: 'Lax',
  secure: true
});
```

#### Available options

| Option       | Type       | Default          | Description              |
| ------------ | ---------- | ---------------- | ------------------------ |
| `timeToLive` | `number`   | `1`              | Expiration duration      |
| `unit`       | `string`   | `hour`           | `hour`, `day`, `month`   |
| `domains`    | `string[]` | current hostname | Domains to set cookie on |
| `path`       | `string`   | `/`              | Cookie path              |
| `sameSite`   | `string`   | `Lax`            | `Lax`, `Strict`, `None`  |
| `secure`     | `boolean`  | auto             | Forced Secure flag       |

### Cross-site cookies (SameSite=None)

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('crossSite', 'true', {
  sameSite: 'None',
  secure: true
});
```

> ⚠️ Browsers **require `Secure`** when using `SameSite=None`.

## Get a cookie

```js
import { getCookie } from 'browser-cookie-utils';

const theme = getCookie('theme');
```

Returns:

- `string` if found
- `null` if not found

## Delete a cookie

```js
import { deleteCookie } from 'browser-cookie-utils';

deleteCookie('theme');
```

### Delete with options (recommended)

```js
import { deleteCookie } from 'browser-cookie-utils';

deleteCookie('user', {
  domains: ['example.com'],
  path: '/',
  sameSite: 'Lax',
  secure: true
});
```

> ⚠️ For deletion to succeed, `domain`, `path`, `secure`, and `sameSite` **must match** the original cookie.

> **Browser (UMD) usage:**
> When using the UMD build via a `<script>` tag, replace imported functions with
> `browserCookieUtils.*`.


## Migration Guide (v1.x → v2.0.0)

Version `2.0.0` introduces a **breaking API change** to improve flexibility and align with modern browser cookie requirements.

### What changed?

The `setCookie` and `deleteCookie` functions now accept an **options object** instead of positional arguments.

---

### `setCookie` migration

#### Before (v1.x):

```js
browserCookieUtils.setCookie('theme', 'dark', 2, 'day', ['.example.com']);
```

#### After (v2.0.0):

```js
browserCookieUtils.setCookie('theme', 'dark', {
  timeToLive: 2,
  unit: 'day',
  domains: ['.example.com']
});
```

### `deleteCookie` migration

#### Before (v1.x):

```js
browserCookieUtils.deleteCookie('theme', ['.example.com']);
```

#### After (v2.0.0):

```js
browserCookieUtils.deleteCookie('theme', {
  domains: ['.example.com']
});
```

### Why the change?

- Clearer, self-documenting API
- Easier future extensions
- Better alignment with modern cookie attributes (SameSite, Secure, path)

If you need the old behavior, continue using `v1.x`, which remains stable.

## Security behavior

- Automatically adds `Secure` on HTTPS
- Supports modern `SameSite` rules
- Uses `encodeURIComponent` / `decodeURIComponent`
- Sets `path=/` by default
- Does **not** set `HttpOnly` (not possible via JavaScript)

## Browser support

- All modern evergreen browsers
- Works without polyfills
- No reliance on deprecated APIs

## License

MIT © [Sami Ahmed Siddiqui](https://github.com/samiahmedsiddiqui)

[build-image]: https://img.shields.io/github/actions/workflow/status/samiahmedsiddiqui/browser-cookie-utils/ci.yml
[build-url]: https://github.com/samiahmedsiddiqui/browser-cookie-utils/actions
[npm-image]: https://img.shields.io/npm/v/browser-cookie-utils.svg
[npm-url]: https://www.npmjs.com/package/browser-cookie-utils
[license-image]: https://img.shields.io/badge/License-MIT-green.svg
[license-url]: LICENSE
[jsdelivr-image]: https://img.shields.io/jsdelivr/npm/hm/browser-cookie-utils
[jsdelivr-url]: https://www.jsdelivr.com/package/npm/browser-cookie-utils
