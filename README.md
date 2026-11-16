# Matter Fee Manager — custom Trello Power-Up

A staged fee schedule for fixed-fee matters. Split a matter into billing stages and move each one through
**Not started → Done · to invoice → Invoiced · unpaid → Paid**. Card-front badges and a board-level
receivables overview show who should be paying you now.

Static front-end files only: no server, no database. **Fee data lives only in your Trello cards**
(Power-Up pluginData). This folder contains code and nothing else.

## Files

| File | Purpose |
|---|---|
| `index.html` + `connector.js` | Trello iframe connector: registers badges, buttons and the card-back section |
| `section.html` + `section.js` | The interactive fee schedule on the card back |
| `overview.html` + `overview.js` | The "Receivables" modal opened from the board button |
| `settings.html` + `settings.js` | Payment terms and stage templates |
| `shared.js` / `ui.css` | Money, date, status and totals logic / styles |
| `icon.svg` / `icon-white.svg` | Icons |
| `demo-preview.html` | Offline demo with fictional data; does not need deploying |

## Deploy (one-off, about 15 minutes)

### 1. Host this folder at an HTTPS address
Trello requires the connector to be served over HTTPS. GitHub Pages is the simplest option:

1. Create a **Public** repository on GitHub (e.g. `matter-fee-manager`). It holds code only, no client data.
2. Upload every file in this folder to the repository root (the files, not the folder itself).
3. Repository Settings → Pages → Source: `Deploy from a branch`; Branch: `main` / `(root)`; Save.
4. After a minute or two you get: `https://<your-username>.github.io/matter-fee-manager/`
5. Open `https://<your-username>.github.io/matter-fee-manager/section.html`. If you see the fee schedule
   with a "Demo mode" banner, hosting works.

(Any static host works the same way: Netlify, Cloudflare Pages, or your own site.)

### 2. Register the Power-Up in Trello
1. Go to https://trello.com/power-ups/admin (you must be an admin of the Workspace; the first visit asks you
   to accept a developer agreement).
2. Click **New**:
   - Name: `Matter Fee Manager`
   - Workspace: the one that contains your board
   - Choose "My app will use Power-Up capabilities"
   - **Iframe connector URL**: `https://<your-username>.github.io/matter-fee-manager/index.html`
   - Email / Support contact / Author: your own details
3. Open the **Capabilities** tab and switch on these six:
   - Board buttons
   - Card back section
   - Card badges
   - Card buttons
   - Card detail badges
   - Show settings
4. Save.

### 3. Enable it on the board
Board → Power-Ups → **Custom** tab → Matter Fee Manager → Add.

## First-run checklist (5 minutes)

The calculations and interface were tested offline, but this code **has not been run inside a live Trello
board**. After enabling it, confirm each item:

- [ ] Any card shows a "Fee schedule" button
- [ ] "Fee schedule" → "New blank fee schedule" makes a "Staged fee schedule" section appear on the card back
- [ ] Enter a stage name and amount, click Save, close and reopen the card: the data is still there
- [ ] Set a stage to "Done · to invoice": a yellow badge appears on the card front
- [ ] The board has a "Receivables" button, and the card shows up in it
- [ ] Cards without a fee schedule do **not** show the section

If anything fails, press F12, open the browser Console and copy the red error text.

## Day-to-day use

1. **Create**: card → "Fee schedule" → use a template or start blank. Enter the contract total at the bottom;
   a yellow warning appears if the stages do not add up to it.
2. **Stage work finished** → set status to "Done · to invoice". The card front shows a yellow "To invoice $X".
3. **Invoice sent** → set status to "Invoiced · unpaid" and enter the invoice number. The due date is filled
   in automatically as invoice date + payment terms (7 days by default; change it in settings or per stage).
4. **Not paid by the due date** → the badge turns red, "Overdue $X · Nd", and the stage moves to the top of
   the receivables overview.
5. **Money received** → set status to "Paid". The paid date defaults to today and can be edited.
6. **Check the receivables overview weekly**: it is sorted overdue → to invoice → not yet due.

Stages payable up front (e.g. on engagement): set them straight to "Invoiced · unpaid" or "Paid"; they do
not need to pass through "Done".

## Known limits

- **No reminders.** A Power-Up runs only while someone has the board open. It cannot send email or push
  notifications. Rely on the badges and the overview.
- **About 4,000 characters per card** (Trello's platform limit is 4096). Twenty fully filled stages use about
  3,000 characters; a save that would exceed the limit is refused with a message.
- **No part payments.** A stage is either unpaid or paid. If a client pays in two parts, split the stage.
- **Two people editing the same card's schedule at once: the later save overwrites the earlier one.**
- **Not an accounting record.** Amounts are typed in by hand for tracking. Nothing syncs with a trust account
  or accounting software, and you should not expect the data in Trello's CSV export.
- Every board member can see the fee data (`shared` visibility).
- Designed for the desktop web app. Trello's mobile apps have limited support for custom Power-Ups; whether
  the schedule shows there is untested.

## Customising

- Status names: `MFM.STATUS` in `shared.js`
- Badge wording and colours: `MFM.badges` in `shared.js`
- Default payment terms and default template: `MFM.DEFAULT_CFG` in `shared.js` (once settings are saved on a
  board, the board's settings take over)

After editing, re-upload the files and hard-refresh Trello (Ctrl/Cmd + Shift + R). GitHub Pages can take a few
minutes to update.
