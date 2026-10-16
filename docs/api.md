# API reference

All functions are safe to call without a browser: they do nothing and return `null`, `false`, `{}` or `[]`.

## Reading

### `getCookie(name)`

Returns the decoded value, or `null` if not found.

```ts
getCookie(name: string): string | null
```

### `hasCookie(name)` <Badge type="tip" text="2.1.0+" />

`true` if the cookie exists, even with an empty value.

```ts
hasCookie(name: string): boolean
```

### `getAllCookies()` <Badge type="tip" text="2.1.0+" />

Every cookie visible to JavaScript.

```ts
getAllCookies(): Record<string, string>
```

### `getCookies(pattern)` <Badge type="tip" text="2.1.0+" />

Cookies whose name matches a glob (`*`, `?`), RegExp or predicate.

```ts
getCookies(pattern: string | RegExp | ((name: string) => boolean)): Record<string, string>
```

### `getJSONCookie(name)` <Badge type="tip" text="2.1.0+" />

Parsed JSON value, or `null` if missing or invalid. `__proto__` keys are dropped.

```ts
getJSONCookie<T = unknown>(name: string): T | null
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

## Factory

### `createCookieUtils(defaults?)` <Badge type="tip" text="2.1.0+" />

Returns all the functions above with default options and an optional `namePrefix`.

```ts
createCookieUtils(defaults?: CookieUtilsDefaults): CookieUtils
```

See [Default options](./guide/default-options).
