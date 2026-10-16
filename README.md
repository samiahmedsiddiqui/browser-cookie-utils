# browser-cookie-utils

[![License: MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]
[![Build][build-image]][build-url]
[![Downloads][jsdelivr-image]][jsdelivr-url]

Lightweight, dependency-free JavaScript helpers for getting, setting, and deleting browser cookies safely and consistently in modern browsers.

📖 **Documentation:** https://samiahmedsiddiqui.github.io/browser-cookie-utils/ · 🗺️ [Roadmap](https://samiahmedsiddiqui.github.io/browser-cookie-utils/roadmap)

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
- Safe encoding / decoding, with custom `encode` / `decode` for cookies written by other systems
- Watch cookies for changes (`onCookieChange`)

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

| File                              | Format     | Notes                                      |
| --------------------------------- | ---------- | ------------------------------------------ |
| `browser-cookie-utils.js`         | ESM        | Non-minified, modern bundlers              |
| `browser-cookie-utils.min.js`     | ESM        | Minified, production-ready (ES module)     |
| `browser-cookie-utils.cjs`        | CJS        | Non-minified, CommonJS                     |
| `browser-cookie-utils.min.cjs`    | CJS        | Minified, production-ready                 |
| `browser-cookie-utils.umd.js`     | UMD        | Minified, `<script>` tag / AMD / CommonJS  |
| `browser-cookie-utils.d.ts`       | Types      | TypeScript declarations (`.d.cts` for CJS) |
| `browser-cookie-utils.min.js.map` | Source map | For minified ESM (published to npm only)   |

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

### Check that a cookie was stored

Browsers drop invalid cookies **silently** (wrong domain, over the ~4 KB size limit, an `HttpOnly` cookie with the same name, an `expires` date in the past, …). `setCookie` returns whether the cookie can be read back with the new value:

```js
if (!setCookie('theme', 'dark', { domains: ['example.com'] })) {
	console.warn('Cookie was not stored');
}
```

> JavaScript can only read cookies whose `path` matches the current page. A cookie set for another path (e.g. `path: '/admin'` from `/`) is stored by the browser but returns `false`.

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

- `second`, `minute`, `hour`, `day`, `week`
- `month` (30 days)
- `year` (365 days)

An unknown unit falls back to `hour`.

### Exact expiry date

```js
setCookie('promo', 'spring', {
	expires: new Date('2030-04-01T00:00:00Z')
});
```

`expires` overrides `timeToLive` / `unit`. An invalid date is ignored.

### Session cookie

```js
setCookie('tab', 'open', { session: true });
```

No expiry is set, so the browser removes the cookie when it closes. `session` overrides `expires` and `timeToLive`.

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

| Option        | Type       | Default          | Description                                   |
| ------------- | ---------- | ---------------- | --------------------------------------------- |
| `timeToLive`  | `number`   | `1`              | Expiration duration                           |
| `unit`        | `string`   | `hour`           | `second` … `year` (see above)                 |
| `expires`     | `Date`     | —                | Exact expiry; overrides `timeToLive` / `unit` |
| `session`     | `boolean`  | `false`          | No expiry; overrides `expires`                |
| `domains`     | `string[]` | current hostname | Domains to set cookie on                      |
| `path`        | `string`   | `/`              | Cookie path                                   |
| `sameSite`    | `string`   | `Lax`            | `Lax`, `Strict`, `None`                       |
| `secure`      | `boolean`  | auto             | Forced Secure flag                            |
| `partitioned` | `boolean`  | `false`          | Adds `Partitioned` (CHIPS); forces `Secure`   |
| `encode`      | `function` | URI encoding     | Custom value encoder (see below)              |

> The `domain` attribute is skipped for `localhost` and IP addresses (browsers reject it there), so a host-only cookie is set instead.

> Cookie names must be valid RFC 6265 tokens (no spaces, `;`, `=`, etc.). Invalid names are ignored.

### Partitioned cookies (CHIPS)

For third-party embeds (widgets, iframes) in browsers that block third-party cookies:

```js
import { setCookie, deleteCookie } from 'browser-cookie-utils';

setCookie('__Host-widget', 'abc', { partitioned: true }); // SameSite=None by default

// Deleting a partitioned cookie needs `partitioned: true` too.
deleteCookie('__Host-widget', { partitioned: true });
```

The cookie is stored separately for each top-level site the embed appears on. `Secure` is always added. Browsers without CHIPS support ignore the attribute.

### Cookie prefixes (`__Secure-` / `__Host-`)

Browsers enforce extra rules for cookies whose names start with these prefixes, and silently reject cookies that break them. The library applies the rules for you in `setCookie`, `deleteCookie` and `deleteCookies`:

| Prefix      | Rules applied                                                         |
| ----------- | --------------------------------------------------------------------- |
| `__Secure-` | `Secure` is always set                                                |
| `__Host-`   | `Secure` is always set, `path=/`, and no `domain` (`domains` ignored) |

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('__Host-session', 'abc123', { timeToLive: 1, unit: 'day' });
```

> Prefixed cookies can only be set from secure pages (HTTPS or `localhost`). Prefixes are matched case-insensitively.

### Cross-site cookies (SameSite=None)

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('crossSite', 'true', {
	sameSite: 'None',
	secure: true
});
```

> ⚠️ Browsers **require `Secure`** when using `SameSite=None`.

## JSON cookies

```js
import { setJSONCookie, getJSONCookie } from 'browser-cookie-utils';

setJSONCookie('prefs', { theme: 'dark', fontSize: 14 }, { unit: 'month' });

getJSONCookie('prefs'); // { theme: 'dark', fontSize: 14 }
```

- `setJSONCookie(name, value, options)` takes the same options as `setCookie`. Nothing is written if the value can't be serialized (circular references, `BigInt`, `undefined`, functions).
- `getJSONCookie(name)` returns the parsed value, or `null` if the cookie is missing or isn't valid JSON.
- In TypeScript, pass the expected type: `getJSONCookie<Prefs>('prefs')`.

> Browsers limit each cookie to about 4 KB **after** URI encoding, and JSON grows when encoded. Keep JSON cookies small.

## Get a cookie

```js
import { getCookie } from 'browser-cookie-utils';

const theme = getCookie('theme');
```

Returns:

- `string` if found (URI-decoded; returned raw if it isn't valid URI encoding)
- `null` if not found

## Check if a cookie exists

```js
import { hasCookie } from 'browser-cookie-utils';

if (hasCookie('consent')) {
	// ...
}
```

Returns `true` when the cookie exists, **even if its value is empty**. Use it instead of `getCookie(name) !== null` checks when an empty value is meaningful.

## Get all cookies

```js
import { getAllCookies } from 'browser-cookie-utils';

getAllCookies(); // { theme: 'dark', lang: 'en' }
```

Returns an object of name → decoded value for every cookie visible to JavaScript (`HttpOnly` cookies are never included). Returns `{}` when there are none.

> If the same name exists on several paths, the browser lists the most specific path first, and that value is used (same as `getCookie`).

## Get cookies by pattern

```js
import { getCookies } from 'browser-cookie-utils';

getCookies('pref_*'); // glob: * matches any characters, ? matches one
getCookies(/^utm_/); // RegExp
getCookies((name) => name.startsWith('ab_')); // predicate
```

Returns an object with only the matching cookies.

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

Without `domains`, `deleteCookie` removes both the host-only cookie and the domain cookie for the current hostname.

`deleteCookie` returns `true` if no cookie with that name is readable afterwards, so you can detect a mismatch.

## Delete cookies by pattern

```js
import { deleteCookies } from 'browser-cookie-utils';

deleteCookies('_ga*'); // glob: * matches any characters, ? matches one
deleteCookies(/^utm_/); // RegExp
deleteCookies((name) => name.startsWith('tmp_')); // predicate
deleteCookies('*'); // every cookie visible to JavaScript
```

Paths are tried with and without a trailing slash (`/a`, `/a/`).

Returns an array with the names of matching cookies that **still exist** afterwards (an empty array means everything matched was deleted).

JavaScript can't read a cookie's domain or path, so by default each matching cookie is expired:

- as a host-only cookie and on the current hostname and each parent domain (`app.example.com`, `example.com`)
- for `/` and each prefix of the current path (`/`, `/a`, `/a/b`)

Pass `domains` and/or `paths` to try specific values only:

```js
deleteCookies('session_*', {
	domains: ['example.com'],
	paths: ['/', '/app']
});
```

> `HttpOnly` cookies are not visible to JavaScript and can't be deleted.

> **Browser (UMD) usage:**
> When using the UMD build via a `<script>` tag, replace imported functions with
> `browserCookieUtils.*`.

## Watch for changes

```js
import { onCookieChange } from 'browser-cookie-utils';

const stop = onCookieChange('theme', ({ name, value, oldValue }) => {
	applyTheme(value); // null when the cookie is deleted
});

onCookieChange('ab_*', handler, { interval: 500 }); // glob, RegExp or predicate

stop(); // stop watching
```

The callback is called once per created, changed or deleted cookie, not for the value it has when you start watching. Where the [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API) is available (secure contexts in recent browsers) its `change` event is used; otherwise `document.cookie` is polled every `interval` ms (default `1000`, clamped to `100`–`2147483647`). `HttpOnly` cookies are never visible to JavaScript.

## Custom encoding (`encode` / `decode`)

Values are written with `encodeURIComponent` and read with `decodeURIComponent` by default. Pass your own functions to read or write cookies in another format:

```js
import { getCookie, setCookie, createCookieUtils } from 'browser-cookie-utils';

getCookie('legacy', { decode: (value) => unescape(value) });
setCookie('raw', 'a:b/c', { encode: (value) => value });

// Or as defaults for every helper
const legacy = createCookieUtils({
	encode: (value) => escape(value),
	decode: (value) => unescape(value)
});
```

Both functions receive the value and the cookie's full name. If `encode` throws, doesn't return a string, or returns control characters, spaces or `;`, nothing is written and `setCookie` returns `false`. If `decode` throws or doesn't return a string, the raw value is returned.

## Default options (`createCookieUtils`)

Create the helpers once with your defaults instead of repeating them in every call:

```js
import { createCookieUtils } from 'browser-cookie-utils';

const cookies = createCookieUtils({
	domains: ['example.com'],
	sameSite: 'Strict',
	unit: 'day'
});

cookies.setCookie('theme', 'dark'); // uses the defaults
cookies.setCookie('lang', 'en', { sameSite: 'Lax' }); // overrides one option
cookies.deleteCookie('theme');
```

The returned object has the same helpers as the module (`getCookie`, `hasCookie`, `getAllCookies`, `getCookies`, `setCookie`, `getJSONCookie`, `setJSONCookie`, `deleteCookie`, `deleteCookies`, `onCookieChange`). Options passed to a single call override the defaults. Defaults can include `encode`, `decode` and the `onCookieChange` `interval`.

### Name prefix

Use `namePrefix` to keep your app's cookies separate from others on the same domain:

```js
const appCookies = createCookieUtils({ namePrefix: 'myapp_' });

appCookies.setCookie('theme', 'dark'); // writes `myapp_theme`
appCookies.getCookie('theme'); // reads `myapp_theme`
appCookies.getAllCookies(); // { theme: 'dark' } — only `myapp_*`, prefix removed
appCookies.deleteCookies('*'); // deletes only `myapp_*` cookies
```

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

- Automatically adds `Secure` on HTTPS, with `SameSite=None` and with `Partitioned`
- Values are encoded with `encodeURIComponent`, so they can't add attributes. A custom `encode` result with control characters, spaces or `;` is refused
- `sameSite` only accepts `Lax`, `Strict` or `None`; anything else becomes `Lax`
- `path` must start with `/` and can't contain spaces, control characters or `;`. Nothing is written for an unsafe path
- Invalid `domains` are skipped. If none is usable, nothing is written and `setCookie` returns `false`
- Glob patterns (`*`, `?`) are matched in linear time. **RegExp patterns you pass are run as-is**, so avoid patterns that can backtrack heavily (e.g. `/^(a+)+$/`)
- `getJSONCookie` drops `__proto__` keys, so merging the result can't change prototypes
- Lifetimes are capped at 400 days by the library. Chromium and Firefox cap at 400 days; WebKit caps lower, and Safari limits cookies set from JavaScript to 7 days (ITP)
- Does **not** set `HttpOnly` (not possible via JavaScript)

### Recommendations

- **Don't store secrets** (session tokens, credentials) in cookies set from JavaScript. Any script on the page can read them. Set them server-side with `HttpOnly`.
- **Subdomains:** by default the cookie is set on the current hostname as a domain cookie, so its subdomains can read it too. For a cookie only the current host can see, use the `__Host-` prefix.
- **Cookie tossing:** a sibling subdomain can set a same-name cookie on the parent domain, and `getCookie` may return it. Treat cookie values as untrusted input, and use `__Host-` names for anything security-sensitive.

## Browser support

- All modern evergreen browsers
- Works without polyfills
- No reliance on deprecated APIs

## Author

**Sami Ahmed Siddiqui**

- GitHub: [@samiahmedsiddiqui](https://github.com/samiahmedsiddiqui)
- LinkedIn: [sami-ahmed-siddiqui](https://www.linkedin.com/in/sami-ahmed-siddiqui/)

Questions and bug reports: please use [GitHub Issues](https://github.com/samiahmedsiddiqui/browser-cookie-utils/issues). Security issues: see [SECURITY.md](SECURITY.md).

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
