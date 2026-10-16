---
layout: home

hero:
  name: browser-cookie-utils
  text: Browser cookies, done safely.
  tagline: Lightweight, dependency-free helpers for getting, setting and deleting cookies — with TypeScript types and secure defaults.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: API reference
      link: /api
    - theme: alt
      text: Roadmap
      link: /roadmap

features:
  - title: Zero dependencies
    details: A few KB minified. ESM, CommonJS and UMD builds, with TypeScript declarations included.
  - title: Secure by default
    details: Automatic Secure on HTTPS, SameSite=Lax, validated attributes, and __Host- / __Secure- prefix rules applied for you.
  - title: Knows when a write fails
    details: Browsers drop invalid cookies silently. setCookie and deleteCookie tell you whether it worked.
  - title: Patterns
    details: Read or delete cookies by glob, RegExp or predicate — e.g. deleteCookies('_ga*') across every domain and path.
  - title: JSON and defaults
    details: Store objects with setJSONCookie, and create a scoped instance with default options and a name prefix.
  - title: Modern cookie features
    details: Partitioned (CHIPS) cookies, session cookies, exact expiry dates and units from seconds to years.
---
