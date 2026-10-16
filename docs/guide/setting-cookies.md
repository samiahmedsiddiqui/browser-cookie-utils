# Setting cookies

## Basic

```js
import { setCookie } from 'browser-cookie-utils';

setCookie('theme', 'dark');
```

Defaults:

- expires in **1 hour**
- `path=/`
- `SameSite=Lax`
- `Secure` on HTTPS pages
- set on the current hostname as a domain cookie (subdomains can read it — see [Security](./security#recommendations))

Values are encoded with `encodeURIComponent`, so any string is safe to store.

## Check that it was stored <Badge type="tip" text="2.1.0+" />

Browsers drop invalid cookies **silently**: a wrong domain, over the ~4 KB size limit, an `HttpOnly` cookie with the same name, an expiry in the past… `setCookie` returns `true` only if the cookie can be read back with the new value.

```js
if (!setCookie('theme', 'dark', { domains: ['example.com'] })) {
	console.warn('Cookie was not stored');
}
```

::: info
JavaScript can only read cookies whose `path` matches the current page. A cookie set for another path (e.g. `path: '/admin'` from `/`) is stored but returns `false`.
:::

## Expiry

### Duration

```js
setCookie('session', 'abc123', { timeToLive: 2, unit: 'hour' });
```

| Unit                                          | Since                              |
| --------------------------------------------- | ---------------------------------- |
| `hour`, `day`, `month` (30 days)              | 1.0.0                              |
| `second`, `minute`, `week`, `year` (365 days) | <Badge type="tip" text="2.1.0+" /> |

- An unknown `unit` falls back to `hour`.
- An invalid `timeToLive` (0, negative, `NaN`, `Infinity`, non-number) falls back to `1`.
- Lifetimes are capped at **400 days** by the library. Chromium and Firefox cap at 400 days; WebKit caps lower, and Safari limits cookies set from JavaScript to 7 days (ITP).

### Exact date <Badge type="tip" text="2.1.0+" />

```js
setCookie('promo', 'spring', { expires: new Date('2030-04-01T00:00:00Z') });
```

`expires` overrides `timeToLive` / `unit`. An invalid date is ignored.

### Session cookie <Badge type="tip" text="2.1.0+" />

```js
setCookie('tab', 'open', { session: true });
```

No expiry is set, so the browser removes it when it closes. `session` overrides `expires` and `timeToLive`.

## All options

```js
setCookie('user', 'sami', {
	timeToLive: 7,
	unit: 'day',
	domains: ['example.com', '.example.org'],
	path: '/',
	sameSite: 'Lax',
	secure: true
});
```

| Option        | Type       | Default          | Description                                                  |
| ------------- | ---------- | ---------------- | ------------------------------------------------------------ |
| `timeToLive`  | `number`   | `1`              | Expiration duration                                          |
| `unit`        | `string`   | `'hour'`         | `second` … `year`                                            |
| `expires`     | `Date`     | —                | Exact expiry; overrides `timeToLive` / `unit`                |
| `session`     | `boolean`  | `false`          | No expiry; overrides `expires`                               |
| `domains`     | `string[]` | current hostname | Domains to set the cookie on; invalid ones are skipped       |
| `path`        | `string`   | `'/'`            | Must start with `/`; nothing is written for an unsafe path   |
| `sameSite`    | `string`   | `'Lax'`          | `Lax`, `Strict` or `None`; anything else becomes `Lax`       |
| `secure`      | `boolean`  | `true` on HTTPS  | Forces the `Secure` flag                                     |
| `partitioned` | `boolean`  | `false`          | Adds `Partitioned` (CHIPS); forces `Secure`, `SameSite=None` |

::: tip localhost and IP addresses
The `domain` attribute is skipped for `localhost` and IP addresses (browsers reject it there), so a host-only cookie is set instead.
:::

Cookie names must be valid RFC 6265 tokens (no spaces, `;`, `=`, etc.). Invalid names are ignored and `setCookie` returns `false`.

## Cross-site cookies

```js
setCookie('crossSite', 'true', { sameSite: 'None' });
```

Browsers require `Secure` with `SameSite=None`, so it's always added.

## Partitioned cookies (CHIPS) <Badge type="tip" text="2.1.0+" />

For third-party embeds (widgets, iframes) in browsers that block third-party cookies:

```js
setCookie('__Host-widget', 'abc', { partitioned: true }); // SameSite=None by default
```

The cookie is stored separately for each top-level site the embed appears on. `Secure` is always added. Browsers without CHIPS support ignore the attribute.

## Cookie prefixes <Badge type="tip" text="2.1.0+" />

Browsers enforce extra rules for names starting with `__Secure-` or `__Host-`, and silently reject cookies that break them. The library applies the rules for you:

| Prefix      | Rules applied                                                         |
| ----------- | --------------------------------------------------------------------- |
| `__Secure-` | `Secure` is always set                                                |
| `__Host-`   | `Secure` is always set, `path=/`, and no `domain` (`domains` ignored) |

```js
setCookie('__Host-session', 'abc123', { timeToLive: 1, unit: 'day' });
```

Prefixed cookies can only be set from secure pages (HTTPS or `localhost`). Prefixes are matched case-insensitively.
