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

**Icon:** `listing-icon.png` (512 × 512). Check the Listings form for the size and format it currently requires and
resize if needed.

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
- [ ] The six capabilities are on: Board buttons, Card back section, Card badges, Card buttons, Card detail badges,
      Show settings.
- [ ] All fields in Basic information, Listings and Privacy and compliance are complete.
- [ ] You have read the Atlassian developer terms, the Trello-specific terms and the public Power-Up guidelines.
- [ ] Test on a second Trello account that is only an observer on the board: it should see no fee badges and no
      fee schedule.
- [ ] Test on a brand-new board: enable, create a schedule from the template, change statuses, open Receivables,
      open Settings.
- [ ] Submit through the form linked from Trello's "Submitting your Power-Up" guide, then wait for the review team.

## After approval

Any file you change at the connector URL is live for every user immediately. Test changes on a separate copy
(a second custom Power-Up pointing at a staging URL) before replacing the live files.
