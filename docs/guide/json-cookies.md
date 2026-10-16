# JSON cookies <Badge type="tip" text="2.1.0+" />

```js
import { setJSONCookie, getJSONCookie } from 'browser-cookie-utils';

setJSONCookie('prefs', { theme: 'dark', fontSize: 14 }, { unit: 'month' });

getJSONCookie('prefs'); // { theme: 'dark', fontSize: 14 }
```

- `setJSONCookie(name, value, options)` takes the same options as `setCookie` and returns the same result. Nothing is written (and `false` is returned) if the value can't be serialized: circular references, `BigInt`, `undefined`, functions.
- `getJSONCookie(name)` returns the parsed value, or `null` if the cookie is missing or isn't valid JSON. `__proto__` keys are dropped.
- In TypeScript, pass the expected type: `getJSONCookie<Prefs>('prefs')`.

::: warning Size
Browsers limit each cookie to about 4 KB **after** URI encoding, and JSON grows when encoded. Keep JSON cookies small.
:::
