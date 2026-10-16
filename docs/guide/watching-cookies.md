# Watching cookies <Badge type="tip" text="2.2.0+" />

`onCookieChange` calls you back when a cookie is created, changed or deleted — by your code, another tab, a server response or a third-party script.

```js
import { onCookieChange } from 'browser-cookie-utils';

const stop = onCookieChange('theme', ({ name, value, oldValue }) => {
	applyTheme(value); // value is null when the cookie is deleted
});

// Later
stop();
```

The callback receives one object per changed cookie:

| Field      | Type             | Description                                 |
| ---------- | ---------------- | ------------------------------------------- |
| `name`     | `string`         | Cookie name                                 |
| `value`    | `string \| null` | New decoded value; `null` when deleted      |
| `oldValue` | `string \| null` | Previous decoded value; `null` when created |

It isn't called for the value the cookie has when you start watching.

## Patterns

Like [`getCookies`](./reading-cookies#by-pattern), the first argument can be a glob (`*`, `?`), a RegExp or a predicate:

```js
onCookieChange('ab_*', ({ name, value }) => track(name, value));
onCookieChange(/^consent/, () => reloadTags());
```

## How changes are detected

- Where the [Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API) is available (secure contexts in recent browsers), its `change` event is used — no polling.
- Otherwise `document.cookie` is checked every `interval` ms (default `1000`, clamped to `100`–`2147483647`).

```js
onCookieChange('session_hint', handler, { interval: 250 });
```

Either way you get the same `{ name, value, oldValue }` objects, and changes are reported shortly after they happen, not synchronously.

## Notes

- Only cookies visible to JavaScript are watched; `HttpOnly` cookies never are.
- If the same name exists on several paths, the value the page sees (the most specific path) is reported.
- Pass `decode` to read values in another format — see [Custom encoding](./encoding).
- An error thrown by your callback is reported (it shows up in the console) without stopping other changes from being delivered.
- With [`createCookieUtils`](./default-options) and a `namePrefix`, only prefixed cookies are watched and `name` is reported without the prefix.
- Calling `stop()` more than once is safe. Outside a browser, `onCookieChange` does nothing and returns a no-op `stop`.
