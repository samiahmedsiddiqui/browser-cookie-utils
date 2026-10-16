# Roadmap

What's shipped, what's next, and the version each feature is expected in. Plans can change — follow the [changelog](./changelog) and [releases](https://github.com/samiahmedsiddiqui/browser-cookie-utils/releases) for what actually shipped.

**Status:** ✅ Released · 🟢 Ready (merged, not yet on npm) · 🚧 In progress · 📋 Planned · 💭 Under consideration

**Priority:** P0 now · P1 high · P2 medium · P3 low

## 2.1.0 — Security, types and new helpers

| Feature                                                            | Status   |
| ------------------------------------------------------------------ | -------- |
| Security hardening (attribute validation, ReDoS-safe globs)        | 🟢 Ready |
| CommonJS `require()` fix                                           | 🟢 Ready |
| TypeScript declarations                                            | 🟢 Ready |
| `hasCookie`, `getAllCookies`, `getCookies(pattern)`                | 🟢 Ready |
| `deleteCookies(pattern)` across domains and paths                  | 🟢 Ready |
| `setJSONCookie` / `getJSONCookie`                                  | 🟢 Ready |
| Units `second` … `year`, `expires: Date`, `session`                | 🟢 Ready |
| `__Secure-` / `__Host-` prefix rules                               | 🟢 Ready |
| `partitioned` (CHIPS)                                              | 🟢 Ready |
| Write verification (`setCookie` / `deleteCookie` return `boolean`) | 🟢 Ready |
| `createCookieUtils` with defaults and `namePrefix`                 | 🟢 Ready |

## Planned

| #   | Feature                                                                                    | Priority | Status | Expected |
| --- | ------------------------------------------------------------------------------------------ | -------- | ------ | -------- |
| 1   | Real-browser tests in CI (Playwright)                                                      | P0       | 🚧     | 2.2.0    |
| 2   | Custom encode / decode (converters) — read cookies written by other systems                | P1       | 📋     | 2.2.0    |
| 3   | `onCookieChange(name, callback)` — Cookie Store `change` event, polling fallback           | P1       | 📋     | 2.2.0    |
| 4   | Explain why a write failed (size check before writing, debug mode)                         | P2       | 📋     | 2.2.0    |
| 5   | `areCookiesEnabled()`                                                                      | P2       | 📋     | 2.2.0    |
| 6   | `refreshCookie(name, options)` — extend expiry, keep the value                             | P2       | 📋     | 2.2.0    |
| 7   | Bundle-size budget in CI                                                                   | P2       | 📋     | 2.2.0    |
| 8   | Automated, provenance-signed npm releases                                                  | P2       | 📋     | 2.2.0    |
| 9   | Consent layer (`browser-cookie-utils/consent`) — categories, blocked writes, clean-up, GPC | P1       | 📋     | 2.3.0    |
| 10  | Server-side helpers — parse `Cookie` headers, build `Set-Cookie` (with `HttpOnly`)         | P2       | 💭     | 2.4.0    |
| 11  | `priority` attribute (`Low` / `Medium` / `High`)                                           | P3       | 📋     | 2.x      |
| 12  | `noConflict()` for the UMD global                                                          | P3       | 📋     | 2.x      |
| 13  | Async API on the Cookie Store                                                              | P3       | 💭     | 3.0.0    |
| 14  | Host-only cookies by default (**breaking**)                                                | P3       | 💭     | 3.0.0    |
| 15  | Framework adapters (e.g. `useCookie` for React) as separate packages                       | P3       | 💭     | —        |

## Released

| Version | Highlights                                              |
| ------- | ------------------------------------------------------- |
| 2.0.1   | ESM export and UMD build fixes                          |
| 2.0.0   | Options object API (breaking), ESM + CJS + UMD builds   |
| 1.0.0   | First release: `getCookie`, `setCookie`, `deleteCookie` |

## Suggest a feature

Open a [feature request](https://github.com/samiahmedsiddiqui/browser-cookie-utils/issues/new/choose).
