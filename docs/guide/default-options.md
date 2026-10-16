# Default options <Badge type="tip" text="2.1.0+" />

Create the helpers once with your defaults instead of repeating them:

```js
import { createCookieUtils } from 'browser-cookie-utils';

const cookies = createCookieUtils({
	domains: ['example.com'],
	sameSite: 'Strict',
	unit: 'day'
});

cookies.setCookie('theme', 'dark'); // uses the defaults
cookies.setCookie('lang', 'en', { sameSite: 'Lax' }); // overrides one option
cookies.deleteCookie('theme');
```

The returned object has the same helpers as the module: `getCookie`, `hasCookie`, `getAllCookies`, `getCookies`, `setCookie`, `getJSONCookie`, `setJSONCookie`, `deleteCookie`, `deleteCookies`.

Options passed to a single call override the defaults. Options set to `undefined` keep the default.

## Name prefix

Use `namePrefix` to keep your app's cookies separate from others on the same domain:

```js
const appCookies = createCookieUtils({ namePrefix: 'myapp_' });

appCookies.setCookie('theme', 'dark'); // writes `myapp_theme`
appCookies.getCookie('theme'); // reads `myapp_theme`
appCookies.getAllCookies(); // { theme: 'dark' } — only `myapp_*`, prefix removed
appCookies.deleteCookies('*'); // deletes only `myapp_*` cookies
```

::: info
`namePrefix` is for organization, not isolation — any script on the page can still read every cookie.
:::
