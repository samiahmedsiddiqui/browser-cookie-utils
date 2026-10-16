# TypeScript <Badge type="tip" text="2.1.0+" />

Type declarations ship with the package — no `@types` package needed. They work for both `import` (`.d.ts`) and `require` (`.d.cts`).

```ts
import {
	setCookie,
	getJSONCookie,
	createCookieUtils,
	type SetCookieOptions
} from 'browser-cookie-utils';

const options: SetCookieOptions = {
	timeToLive: 7,
	unit: 'day',
	sameSite: 'Strict'
};
setCookie('theme', 'dark', options);

interface Prefs {
	theme: 'light' | 'dark';
	fontSize: number;
}

const prefs = getJSONCookie<Prefs>('prefs'); // Prefs | null
```

## Exported types

| Type                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `CookieUnit`           | `'second' \| 'minute' \| 'hour' \| 'day' \| 'week' \| 'month' \| 'year'` |
| `CookieSameSite`       | `'Lax' \| 'Strict' \| 'None'`                                            |
| `CookieAttributes`     | `domains`, `path`, `sameSite`, `secure`, `partitioned`                   |
| `SetCookieOptions`     | `CookieAttributes` + `timeToLive`, `unit`, `expires`, `session`          |
| `DeleteCookiesOptions` | `CookieAttributes` with `paths` instead of `path`                        |
| `CookieNamePattern`    | `string \| RegExp \| ((name: string) => boolean)`                        |
| `CookieUtilsDefaults`  | `SetCookieOptions` + `paths` + `namePrefix`                              |
| `CookieUtils`          | The object returned by `createCookieUtils`                               |
