# Matter Fee Manager

A Trello Power-Up that adds a staged fee schedule to cards, for people who bill fixed-fee work in stages.

Split a job into billing stages and move each one through
**Not started → Done · to invoice → Invoiced · unpaid → Paid**. Card badges and a board-level receivables
overview show what to invoice, what is awaiting payment and what is overdue.

Version 1.1.0 · English and 简体中文

## Features

- Fee schedule on the card back: stages, amounts, invoice numbers, due dates, part payments
- Running summary: contract total, received, receivable now, not yet due, with a cross-check against the contract total
- Card-front badges: to invoice, unpaid, overdue (with days), paid in full
- Receivables overview for the whole board, sorted by urgency, with CSV export
- Stage templates, currency symbol, payment terms and language in board settings
- Concurrent-edit protection: nothing is overwritten silently when two people edit the same card
- Fee figures are shown only to board members with edit access

## Data and privacy

Static front-end files only. There is no server and no database. All fee data is stored in Trello Power-Up
storage on the user's own board (`card/shared/fee` and `board/shared/cfg`). See `privacy.html`.

Trello limits Power-Up storage to 4096 characters per card, which is roughly 20 stages.

## Files

| File | Purpose |
|---|---|
| `index.html`, `connector.js` | Trello iframe connector: badges, buttons, card-back section |
| `section.html`, `section.js` | The fee schedule on the card back |
| `overview.html`, `overview.js` | Receivables overview modal |
| `settings.html`, `settings.js` | Board settings |
| `welcome.html`, `welcome.js` | Getting-started modal shown when the Power-Up is enabled |
| `shared.js` | Money, dates, statuses, totals, badges, access rule |
| `i18n.js` | All interface strings, English and Chinese |
| `ui.css`, `icon.svg`, `icon-white.svg` | Styles and button icons |
| `privacy.html`, `support.html` | Privacy policy and help page |
| `LISTING.md`, `listing-icon.*`, `listing-demo.gif` | Copy, icon and demo animation for the Trello directory listing |
| `boot.js` | Page start-up (kept separate so no page needs an inline script) |
| `_headers` | HTTP security headers (Content-Security-Policy, HSTS and others) for hosts that support this file, such as Cloudflare Pages and Netlify |

## Self-hosting

1. Serve this folder over HTTPS from a host that applies the `_headers` file (for example Cloudflare Pages or Netlify). GitHub Pages works but cannot send the security headers.
2. In https://trello.com/power-ups/admin create a Power-Up whose Iframe connector URL is `…/index.html`.
3. Enable the capabilities: Board buttons, Card back section, Card badges, Card buttons, Card detail badges, On enable, Show settings.
4. Add it to a board from Power-Ups → Custom.

Opening `section.html`, `overview.html` or `settings.html` directly in a browser runs them in demo mode with
fictional data.

## Known limits

- No reminders or notifications. A Power-Up runs only while a board is open.
- Not an accounting, tax or trust account record. Figures are typed in by hand.
- Designed for the desktop web app; Trello's mobile apps have limited support for custom Power-Up sections.

## Changelog

**1.1.0**
- One build for English and 简体中文, with a language setting
- Currency symbol setting; dates follow the browser's regional format
- Part payments on invoiced stages
- Concurrent-edit protection
- Fee data hidden from viewers without edit access
- CSV export from the receivables overview
- Privacy policy and support pages
- Welcome modal with getting-started steps when the Power-Up is enabled
- Content-Security-Policy with a strict script-src (no inline scripts, no eval); security headers in `_headers`

**1.0.0** Initial version.

---

© 2026 ZHIJIEVISA PTY LTD. All rights reserved.
