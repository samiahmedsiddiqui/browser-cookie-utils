# Security

## What the library does

- Adds `Secure` on HTTPS, with `SameSite=None`, and with `Partitioned`
- Encodes values with `encodeURIComponent`, so they can't add attributes
- Accepts only `Lax`, `Strict` or `None` for `sameSite` — anything else becomes `Lax`
- Requires `path` to start with `/` and refuses spaces, control characters and `;`. Nothing is written for an unsafe path
- Skips invalid `domains`. If none is usable, nothing is written and `setCookie` returns `false`
- Validates cookie names (RFC 6265 tokens)
- Applies `__Secure-` / `__Host-` prefix rules
- Matches glob patterns (`*`, `?`) in linear time
- Drops `__proto__` keys in `getJSONCookie`
- Caps lifetimes at 400 days. Chromium and Firefox cap at 400 days; WebKit caps lower, and Safari limits cookies set from JavaScript to 7 days (ITP)

It does **not** set `HttpOnly` — that's impossible from JavaScript.

## Recommendations

::: danger Don't store secrets
Session tokens and credentials don't belong in cookies set from JavaScript: any script on the page can read them. Set them server-side with `HttpOnly`.
:::

- **Subdomains.** By default the cookie is set on the current hostname as a domain cookie, so its subdomains can read it. For a cookie only the current host can see, use a `__Host-` name.
- **Cookie tossing.** A sibling subdomain can set a same-name cookie on the parent domain, and `getCookie` may return it. Treat values as untrusted input, and use `__Host-` names for anything security-sensitive.
- **RegExp patterns** you pass to `getCookies` / `deleteCookies` run as-is. Avoid patterns that can backtrack heavily, such as `/^(a+)+$/`.
- **Don't build options from untrusted input** (query strings, user settings) without validating them.

## Reporting a vulnerability

Please report privately through [GitHub Security Advisories](https://github.com/samiahmedsiddiqui/browser-cookie-utils/security/advisories/new), not a public issue.
