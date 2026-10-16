# Migration: v1 → v2

Version 2.0.0 replaced positional arguments with an **options object** in `setCookie` and `deleteCookie`.

## `setCookie`

```js
// v1
setCookie('theme', 'dark', 2, 'day', ['.example.com']);

// v2
setCookie('theme', 'dark', {
	timeToLive: 2,
	unit: 'day',
	domains: ['.example.com']
});
```

## `deleteCookie`

```js
// v1
deleteCookie('theme', ['.example.com']);

// v2
deleteCookie('theme', { domains: ['.example.com'] });
```

## Why

- Clearer, self-documenting calls
- Room for new options without breaking changes
- Matches modern cookie attributes (`SameSite`, `Secure`, `path`)

v1.x stays available if you need the old signature.
