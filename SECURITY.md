# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a vulnerability

Please **don't** open a public issue. Report it privately through
[GitHub Security Advisories](https://github.com/samiahmedsiddiqui/browser-cookie-utils/security/advisories/new).

Include the package version, build (ESM / CJS / UMD), browser, and steps or code to reproduce.

I aim to respond within 7 days. Once a fix is released, the advisory is published with credit to the reporter (unless you prefer otherwise).

## Scope

This library runs in the browser and can only access cookies that aren't `HttpOnly`. Don't store secrets such as session tokens in cookies set from JavaScript; set those server-side with `HttpOnly`.
