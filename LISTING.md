# Trello directory listing — copy to paste into the Power-Up admin portal

Bracketed items are for you to fill in. Nothing here is submitted automatically.

## Basic information

| Field | Value |
|---|---|
| Name | Matter Fee Manager |
| Iframe connector URL | `https://matter-fee-manager.pages.dev/` |
| Author | ZHIJIEVISA PTY LTD |
| Email | info@zhijievisa.com |
| Support contact | info@zhijievisa.com (help page: `https://matter-fee-manager.pages.dev/support`) |
| Atlassian account email | [EMAIL OF YOUR ATLASSIAN ACCOUNT] |

## Privacy and compliance

| Field | Value |
|---|---|
| Privacy policy URL | `https://matter-fee-manager.pages.dev/privacy` |
| Stores personal data outside Trello? | No. All data is stored in Trello Power-Up storage on the user's board. |

## Listing

**Icon (URL field, 144 × 144 px, HTTPS):** `https://matter-fee-manager.pages.dev/listing-icon-144.png`
(`listing-icon.png` is the same design at 512 × 512.)

**Overview (one line):**

> Turn any card into a staged fee schedule. See what to invoice, what is unpaid and what is overdue, on the card and across the whole board.

**Images (fictional data, hosted with the Power-Up):**

| Use | URL |
|---|---|
| Animation: stages moving from invoiced to paid, badges updating | `https://matter-fee-manager.pages.dev/img/demo.gif` |
| Fee schedule on the card, with card-front badges | `https://matter-fee-manager.pages.dev/img/fee-schedule.png` |
| Receivables overview for the board | `https://matter-fee-manager.pages.dev/img/receivables.png` |
| Card-front badges only | `https://matter-fee-manager.pages.dev/img/badges.png` |

**Description:** paste the text below into the editor, then insert each image where marked.

```
Matter Fee Manager is for people who agree a fixed fee with a client and bill it in stages: lawyers, migration agents, accountants, consultants, designers, agencies. If each job is already a Trello card, this Power-Up puts the fee schedule on that card and tells you when it is time to send an invoice or chase a payment.

[IMAGE: demo.gif]

The problem it solves

With fixed-fee work the money falls due when a step is finished, not at the end of the month. It is easy to finish a step and forget to bill it, or to bill it and not notice the invoice is three weeks overdue. Trello shows you where the work is up to. It does not show you where the money is up to. Matter Fee Manager does.

How it works

1. Open a card and add a fee schedule. List the billing stages and the amount for each one, or apply a template you have saved.
2. As the work moves on, change each stage's status: Not started → Done · to invoice → Invoiced · unpaid → Paid.
3. The card and the board update straight away, so you can see what to invoice next and who has not paid.

What you see on the card

[IMAGE: fee-schedule.png]

- Every stage with its amount, status, invoice number and due date.
- A running summary: contract total, received, receivable now, and not yet due.
- A coloured progress bar showing how much of the fee has been collected.
- Part payments: record what has been received on an invoice and the balance is tracked.
- A warning if your stages do not add up to the contract total.
- The due date is filled in from your payment terms when you mark a stage as invoiced.

What you see on the board

- Badges on the front of each card: yellow for work done and not yet invoiced, orange for invoiced and awaiting payment, red for overdue with the number of days, green when the fee is paid in full.

[IMAGE: receivables.png]

- A Receivables button that opens one list of every stage that needs an invoice or a follow-up, across all cards, most urgent first, with totals for the board.
- CSV export of every stage for your spreadsheet or your bookkeeper.

Why use it

- Bill on time. Finished work shows up as "to invoice" until you bill it.
- Chase the right clients. Overdue amounts turn red and rise to the top of the list.
- Know your position. See at any moment how much has been received, how much is owed now and how much is still to come.
- No new system to learn. It lives on the cards you already use, with no separate login.

Set up for your practice

- Templates for your usual stage breakdowns, applied in one click.
- Your own currency symbol and payment terms.
- English and Simplified Chinese.
- If two people edit the same schedule at once, nothing is overwritten without asking.

Your data stays in Trello

Everything is stored on your own board using Trello's Power-Up storage. There is no external server, no account to create, no analytics and no tracking. Fee figures are shown only to board members with edit access. Trello stores Power-Up data so that anyone who can view a board can technically read it, so do not use this on public boards for confidential figures.

Good to know

- It does not send reminders. Use the badges and the Receivables overview.
- It is a tracking tool, not an accounting, tax or trust account record.
- Free to use.

Help and support: https://matter-fee-manager.pages.dev/support
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
| Connector URL | `https://matter-fee-manager.pages.dev/` |
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
