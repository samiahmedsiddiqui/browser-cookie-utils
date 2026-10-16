# Custom encoding <Badge type="tip" text="2.2.0+" />

By default values are written with `encodeURIComponent` and read with `decodeURIComponent`. Pass `encode` / `decode` to read or write cookies in another format, e.g. cookies set by a backend that uses a different encoding.

```js
import { getCookie, setCookie } from 'browser-cookie-utils';

// A cookie written by PHP's urlencode() or an old escape() call
getCookie('legacy', { decode: (value) => unescape(value) });

// Store the value as-is (it must already be cookie-safe)
setCookie('raw', 'a:b/c', { encode: (value) => value });
```

Both functions receive the value (a string) and the cookie's full name, so one converter can treat some cookies differently.

## As defaults

Set them once with [`createCookieUtils`](./default-options) and every helper uses them:

```js
import { createCookieUtils } from 'browser-cookie-utils';

const legacy = createCookieUtils({
	encode: (value) => escape(value),
	decode: (value) => unescape(value)
});

legacy.setCookie('lang', 'français');
legacy.getCookie('lang'); // 'français'
legacy.getAllCookies(); // every cookie, decoded with unescape
```

A per-call `encode` or `decode` overrides the default. `decode` is used by `getCookie`, `getAllCookies`, `getCookies`, `getJSONCookie` and `onCookieChange`; `encode` by `setCookie` and `setJSONCookie`.

## Rules

- If `encode` throws, doesn't return a string, or returns control characters, spaces or `;`, **nothing is written** and `setCookie` returns `false`. A converter can't add attributes such as `domain` or `path`.
- If `decode` throws or doesn't return a string, the raw value is returned.
- A non-function `encode` / `decode` is ignored and the default is used.
