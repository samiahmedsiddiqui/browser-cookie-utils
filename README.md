# browser-cookie-utils

[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Build][build-image]][build-url]
[![Downloads][jsdelivr-image]][jsdelivr-url]

Lightweight, dependency-free JavaScript helpers for getting, setting, and deleting browser cookies safely and consistently in modern browsers.

## Features

- Zero runtime dependencies
- Browser-only, but safe to import during SSR (helpers are no-ops without `document`)
- TypeScript declarations included
- Simple, ergonomic API
- Cookie expiration with time units
- Multi-domain cookie support
- Automatic Secure flag on HTTPS (and always with `SameSite=None`)
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

#### CJS import (CommonJS bundlers):

```js
const { getCookie, setCookie, deleteCookie } = require('browser-cookie-utils');
```

### Browser (UMD / CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils@2/dist/browser-cookie-utils.umd.js"></script>
```

> Pin the major version (`@2`) so a future breaking release doesn't break your page.

### Available Builds

| File                              | Format     | Notes                                        |
| --------------------------------- | ---------- | -------------------------------------------- |
| `browser-cookie-utils.js`         | ESM        | Non-minified, modern bundlers                |
| `browser-cookie-utils.min.js`     | ESM        | Minified, production-ready (ES module)       |
| `browser-cookie-utils.cjs`        | CJS        | Non-minified, CommonJS                       |
| `browser-cookie-utils.min.cjs`    | CJS        | Minified, production-ready                   |
| `browser-cookie-utils.umd.js`     | UMD        | Minified, `<script>` tag / AMD / CommonJS    |
| `browser-cookie-utils.d.ts`       | Types      | TypeScript declarations (`.d.cts` for CJS)   |
| `browser-cookie-utils.min.js.map` | Source map | For minified ESM (published to npm only)     |

All builds use ES2015+ syntax (`const`, arrow functions, template literals), so Internet Explorer is not supported.

> **Note:** Only the UMD build attaches itself to `window.browserCookieUtils`.

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

```html
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils@2/dist/browser-cookie-utils.umd.js"></script>
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

An unknown unit falls back to `hour`.

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

> The `domain` attribute is skipped for `localhost` and IP addresses (browsers reject it there), so a host-only cookie is set instead.

> Cookie names must be valid RFC 6265 tokens (no spaces, `;`, `=`, etc.). Invalid names are ignored.
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

- `string` if found (URI-decoded; returned raw if it isn't valid URI encoding)
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

> ⚠️ For deletion to succeed, `domains` and `path` **must match** the ones used when the cookie was set.

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

- Automatically adds `Secure` on HTTPS and whenever `SameSite=None`
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
