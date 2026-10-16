# Deleting cookies

## One cookie

```js
import { deleteCookie } from 'browser-cookie-utils';

deleteCookie('theme');
```

Without `domains`, both the host-only cookie and the domain cookie for the current hostname are removed. <Badge type="tip" text="2.1.0+" />

### With options

```js
deleteCookie('user', {
	domains: ['example.com'],
	path: '/'
});
```

::: warning Must match
`domains` and `path` must match the ones used when the cookie was set. Partitioned cookies also need `partitioned: true`.
:::

`deleteCookie` returns `true` if no cookie with that name is readable afterwards, so you can detect a mismatch. <Badge type="tip" text="2.1.0+" />

## By pattern <Badge type="tip" text="2.1.0+" />

```js
import { deleteCookies } from 'browser-cookie-utils';

deleteCookies('_ga*'); // glob
deleteCookies(/^utm_/); // RegExp
deleteCookies((name) => name.startsWith('tmp_')); // predicate
deleteCookies('*'); // every cookie visible to JavaScript
```

Returns the names of matching cookies that **still exist** afterwards (`[]` means everything matched was deleted).

JavaScript can't read a cookie's domain or path, so by default each match is expired:

- as a host-only cookie, and on the current hostname and each parent domain (`app.example.com`, `example.com`)
- for `/` and each prefix of the current path, with and without a trailing slash (`/a`, `/a/`, `/a/b`, `/a/b/`)

Pass `domains` and/or `paths` to try only those:

```js
deleteCookies('session_*', {
	domains: ['example.com'],
	paths: ['/', '/app']
});
```

::: info
`HttpOnly` cookies aren't visible to JavaScript and can't be deleted. `__Host-` cookies are only tried host-only on `/`, the only place they can exist.
:::
