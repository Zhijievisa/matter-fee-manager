# Trello directory listing — copy to paste into the Power-Up admin portal

Bracketed items are for you to fill in. Nothing here is submitted automatically.

## Basic information

| Field | Value |
|---|---|
| Name | Matter Fee Manager |
| Iframe connector URL | `https://zhijievisa.github.io/matter-fee-manager/index.html` |
| Author | ZHIJIEVISA PTY LTD |
| Email | info@zhijievisa.com |
| Support contact | info@zhijievisa.com (help page: `https://zhijievisa.github.io/matter-fee-manager/support.html`) |
| Atlassian account email | [EMAIL OF YOUR ATLASSIAN ACCOUNT] |

## Privacy and compliance

| Field | Value |
|---|---|
| Privacy policy URL | `https://zhijievisa.github.io/matter-fee-manager/privacy.html` |
| Stores personal data outside Trello? | No. All data is stored in Trello Power-Up storage on the user's board. |

## Listing

**Icon (URL field, 144 × 144 px, HTTPS):** `https://zhijievisa.github.io/matter-fee-manager/listing-icon-144.png`
(`listing-icon.png` is the same design at 512 × 512.)

**Overview (one line):**

> Staged fee schedules for fixed-fee work: see what has been invoiced, what is overdue and what to bill next.

**Description (Markdown):**

```markdown
**Matter Fee Manager** turns any card into a staged fee schedule for fixed-fee work.

Split a job into billing stages, then move each stage through four steps:
**Not started → Done · to invoice → Invoiced · unpaid → Paid**.

### What you get

- **A fee schedule on the card.** Stage names, amounts, invoice numbers, due dates, part payments, and a
  running summary of contract total, received, receivable now and not yet due.
- **Badges on the card front.** See at a glance which cards have money to invoice, awaiting payment or overdue.
- **A receivables overview for the whole board.** Every stage that needs invoicing or chasing, most urgent
  first, with board totals and CSV export.
- **Templates.** Save your usual stage breakdowns and apply them in one click.
- **English and 简体中文**, your own currency symbol and payment terms.

### Your data stays in Trello

Everything is stored on your own board using Trello's Power-Up storage. There is no external server, no account
to create, no analytics and no tracking.

Fee figures are shown only to board members with edit access. Trello stores Power-Up data so that anyone who can
view a board can technically read it, so do not use this on public boards for confidential figures.

### Good to know

- It does not send reminders; use the badges and the overview.
- It is a tracking tool, not an accounting, tax or trust account record.
- Free to use. [REMOVE THIS LINE WHEN PRICING CHANGES]
```

**Suggested categories:** Board utilities; Analytics & reporting. Choose from whatever the form offers.

## Before you submit

- [ ] Version 1.1 is live at the connector URL and you have used it on your own board for at least a few weeks.
- [ ] `privacy.html` and `support.html`: every bracketed placeholder is replaced, and you have reviewed the
      privacy policy as a legal document for your own entity.
- [ ] The seven capabilities are on: Board buttons, Card back section, Card badges, Card buttons, Card detail badges,
      On enable, Show settings.
- [ ] All fields in Basic information, Listings and Privacy and compliance are complete.
- [ ] You have read the Atlassian developer terms, the Trello-specific terms and the public Power-Up guidelines.
- [ ] Test on a second Trello account that is only an observer on the board: it should see no fee badges and no
      fee schedule.
- [ ] Test on a brand-new board: enable, create a schedule from the template, change statuses, open Receivables,
      open Settings.
- [ ] No red errors in the browser Console (F12) while using the Power-Up. Reviewers reject Power-Ups with console errors.
- [ ] Submit through the form at go.trello.com/dev-support (see "Submission form answers" below), then wait for
      the review team. Trello's guide says review usually takes two weeks or more.

## Submission form answers

Have these ready; the form asks questions so the reviewers know how to test.

| Item | Value |
|---|---|
| Connector URL | `https://zhijievisa.github.io/matter-fee-manager/index.html` |
| Power-Up ID | [POWER-UP ID — the long ID in the address bar when you edit the Power-Up in the admin portal] |
| Preferred launch date | [DATE YOU WANT IT TO GO LIVE, or "as soon as approved"] |

**What it does (paste):**

> Matter Fee Manager adds a staged fee schedule to cards for people who bill fixed-fee work in stages. Each stage
> moves through Not started → Done · to invoice → Invoiced · unpaid → Paid. Card badges show amounts to invoice,
> unpaid and overdue; a board button opens a receivables overview for the whole board with CSV export.

**How to test (paste):**

> 1. Enable the Power-Up on a board. A short welcome modal opens.
> 2. Open a card → Power-Ups button below the card → "Fee schedule" → "Use template" or "New blank fee schedule".
> 3. In the "Staged fee schedule" section, enter stage names and amounts and click Save.
> 4. Change a stage to "Done · to invoice": a yellow badge appears on the card front.
> 5. Change it to "Invoiced · unpaid": a due date is filled in from the payment terms; a "Received" field accepts a
>    part payment. Set the due date in the past to see the red overdue badge.
> 6. Click "Receivables" on the board to see the overview and "Export CSV".
> 7. Power-Up Settings: language (English / Simplified Chinese), currency symbol, payment terms, templates.

**Data and privacy (paste):**

> All data is stored in Trello Power-Up storage (card/shared and board/shared). There is no external server, no
> third-party account, no analytics and no tracking. No personal data is stored outside Trello.

**Why some viewers see less (paste if asked about the "shared perspective" guideline):**

> Fee figures are confidential business information. Badges and the fee schedule are therefore shown only to
> signed-in members who can edit the board; observers and public viewers see nothing from this Power-Up. This is
> stated in the welcome modal, the help page and the privacy policy.

**Demo animation:** `listing-demo.gif` (fictional data) can be attached or used in the description.

## After approval

Any file you change at the connector URL is live for every user immediately. Test changes on a separate copy
(a second custom Power-Up pointing at a staging URL) before replacing the live files.
