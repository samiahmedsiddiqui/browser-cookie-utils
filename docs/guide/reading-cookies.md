# Reading cookies

## One cookie

```js
import { getCookie } from 'browser-cookie-utils';

getCookie('theme'); // 'dark', or null if not found
```

The value is URI-decoded. If it isn't valid URI encoding (e.g. written by other code), the raw value is returned instead of throwing. To read values in another format, pass a `decode` function — see [Custom encoding](./encoding).

## Does it exist? <Badge type="tip" text="2.1.0+" />

```js
import { hasCookie } from 'browser-cookie-utils';

if (hasCookie('consent')) {
	// ...
}
```

Returns `true` even when the value is empty — use it instead of `getCookie(name) !== null` when an empty value matters.

## All cookies <Badge type="tip" text="2.1.0+" />

```js
import { getAllCookies } from 'browser-cookie-utils';

getAllCookies(); // { theme: 'dark', lang: 'en' }
```

Every cookie visible to JavaScript (`HttpOnly` cookies never are), as `name → decoded value`. Returns `{}` when there are none.

## By pattern <Badge type="tip" text="2.1.0+" />

```js
import { getCookies } from 'browser-cookie-utils';

getCookies('pref_*'); // glob: * any characters, ? one character
getCookies(/^utm_/); // RegExp
getCookies((name) => name.startsWith('ab_')); // predicate
```

## Duplicate names

The same name can exist on several paths or domains. The browser lists the most specific path first, and that value is returned by `getCookie`, `getAllCookies` and `getCookies`.

::: warning
A sibling subdomain can plant a same-name cookie on the parent domain. Treat cookie values as untrusted input — see [Security](./security).
:::
