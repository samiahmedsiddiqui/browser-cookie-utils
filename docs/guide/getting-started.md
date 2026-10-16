# Getting started

## Install

::: code-group

```sh [npm]
npm install browser-cookie-utils@2
```

```sh [pnpm]
pnpm add browser-cookie-utils@2
```

```sh [yarn]
yarn add browser-cookie-utils@2
```

:::

## Import

::: code-group

```js [ES modules]
import { setCookie, getCookie, deleteCookie } from 'browser-cookie-utils';
```

```js [CommonJS]
const { setCookie, getCookie, deleteCookie } = require('browser-cookie-utils');
```

```html [Script tag (CDN)]
<script src="https://cdn.jsdelivr.net/npm/browser-cookie-utils@2/dist/browser-cookie-utils.umd.js"></script>
<script>
	browserCookieUtils.setCookie('theme', 'dark');
</script>
```

:::

::: tip Pin the major version
Use `@2` in CDN URLs so a future breaking release doesn't break your page.
:::

## First cookie

```js
import { setCookie, getCookie, deleteCookie } from 'browser-cookie-utils';

setCookie('theme', 'dark'); // 1 hour, path=/, SameSite=Lax, Secure on HTTPS
getCookie('theme'); // 'dark'
deleteCookie('theme');
```

Next: [Setting cookies](./setting-cookies) covers expiry, domains, paths and every other option.

## Available builds

| File                              | Format     | Notes                                      |
| --------------------------------- | ---------- | ------------------------------------------ |
| `browser-cookie-utils.js`         | ESM        | Non-minified                               |
| `browser-cookie-utils.min.js`     | ESM        | Minified (used by `import`)                |
| `browser-cookie-utils.cjs`        | CJS        | Non-minified                               |
| `browser-cookie-utils.min.cjs`    | CJS        | Minified (used by `require`)               |
| `browser-cookie-utils.umd.js`     | UMD        | Minified; `<script>` tag, AMD or CommonJS  |
| `browser-cookie-utils.d.ts`       | Types      | TypeScript declarations (`.d.cts` for CJS) |
| `browser-cookie-utils.min.js.map` | Source map | For the minified ESM build (npm only)      |

Only the UMD build creates the `window.browserCookieUtils` global.

## Environments

- **Browsers:** all modern evergreen browsers, no polyfills needed. Builds use ES2015+ syntax, so Internet Explorer isn't supported.
- **SSR / Node:** safe to import. Without `document`, the functions do nothing and return `null`, `false`, `{}` or `[]`.
