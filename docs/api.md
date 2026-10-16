# API reference

All functions are safe to call without a browser: they do nothing and return `null`, `false`, `{}` or `[]`.

## Reading

### `getCookie(name, options?)`

Returns the decoded value, or `null` if not found.

```ts
getCookie(name: string, options?: CookieReadOptions): string | null
```

`options.decode` replaces `decodeURIComponent`. <Badge type="tip" text="2.2.0+" /> It also works on `getAllCookies`, `getCookies` and `getJSONCookie`. See [Custom encoding](./guide/encoding).

### `hasCookie(name)` <Badge type="tip" text="2.1.0+" />

`true` if the cookie exists, even with an empty value.

```ts
hasCookie(name: string): boolean
```

### `getAllCookies()` <Badge type="tip" text="2.1.0+" />

Every cookie visible to JavaScript.

```ts
getAllCookies(options?: CookieReadOptions): Record<string, string>
```

### `getCookies(pattern)` <Badge type="tip" text="2.1.0+" />

Cookies whose name matches a glob (`*`, `?`), RegExp or predicate.

```ts
getCookies(pattern: string | RegExp | ((name: string) => boolean), options?: CookieReadOptions): Record<string, string>
```

### `getJSONCookie(name)` <Badge type="tip" text="2.1.0+" />

Parsed JSON value, or `null` if missing or invalid. `__proto__` keys are dropped.

```ts
getJSONCookie<T = unknown>(name: string, options?: CookieReadOptions): T | null
```

## Writing

### `setCookie(name, value, options?)`

Returns `true` if the cookie is readable with the new value afterwards. <Badge type="tip" text="2.1.0+" />

```ts
setCookie(name: string, value: string | number | boolean, options?: SetCookieOptions): boolean
```

| Option        | Type                          | Default                               |
| ------------- | ----------------------------- | ------------------------------------- |
| `timeToLive`  | `number`                      | `1`                                   |
| `unit`        | `CookieUnit`                  | `'hour'`                              |
| `expires`     | `Date`                        | —                                     |
| `session`     | `boolean`                     | `false`                               |
| `domains`     | `string[]`                    | current hostname                      |
| `path`        | `string`                      | `'/'`                                 |
| `sameSite`    | `'Lax' \| 'Strict' \| 'None'` | `'Lax'` (`'None'` with `partitioned`) |
| `secure`      | `boolean`                     | `true` on HTTPS                       |
| `partitioned` | `boolean`                     | `false`                               |
| `encode`      | `(value, name) => string`     | `encodeURIComponent` (2.2.0+)         |

See [Setting cookies](./guide/setting-cookies) for details.

### `setJSONCookie(name, value, options?)` <Badge type="tip" text="2.1.0+" />

Serializes `value` with `JSON.stringify`. `false` if it can't be serialized.

```ts
setJSONCookie(name: string, value: unknown, options?: SetCookieOptions): boolean
```

## Deleting

### `deleteCookie(name, options?)`

`true` if no cookie with that name is readable afterwards. <Badge type="tip" text="2.1.0+" />

```ts
deleteCookie(name: string, options?: CookieAttributes): boolean
```

Options: `domains`, `path`, `sameSite`, `secure`, `partitioned`.

### `deleteCookies(pattern, options?)` <Badge type="tip" text="2.1.0+" />

Deletes every match across candidate domains and paths. Returns the names that still exist.

```ts
deleteCookies(pattern: CookieNamePattern, options?: DeleteCookiesOptions): string[]
```

Options: `domains`, `paths`, `sameSite`, `secure`, `partitioned`.

## Watching

### `onCookieChange(pattern, callback, options?)` <Badge type="tip" text="2.2.0+" />

Calls `callback` when a matching cookie is created, changed or deleted. Uses the Cookie Store `change` event where available, otherwise polls every `interval` ms. Returns a function that stops watching.

```ts
onCookieChange(
	pattern: CookieNamePattern,
	callback: (change: { name: string; value: string | null; oldValue: string | null }) => void,
	options?: { interval?: number; decode?: (value: string, name: string) => string }
): () => void
```

`interval` defaults to `1000` and is clamped to `100`–`2147483647`. See [Watching cookies](./guide/watching-cookies).

## Factory

### `createCookieUtils(defaults?)` <Badge type="tip" text="2.1.0+" />

Returns all the functions above with default options and an optional `namePrefix`.

```ts
createCookieUtils(defaults?: CookieUtilsDefaults): CookieUtils
```

See [Default options](./guide/default-options).
