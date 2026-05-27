# FinFlow — Personal Finance Dashboard

A private, browser-based personal finance tracker. All data is stored locally in your browser — nothing is sent to a server.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [First-Time Setup Wizard](#first-time-setup-wizard)
3. [Navigating the App](#navigating-the-app)
4. [Dashboard](#dashboard)
5. [Expenses](#expenses)
6. [Income (Revenue)](#income-revenue)
7. [Loans](#loans)
8. [Savings Goals](#savings-goals)
9. [Bill Calendar](#bill-calendar)
10. [Analytics & Insights](#analytics--insights)
11. [Month Archive](#month-archive)
12. [Budget Envelopes](#budget-envelopes)
13. [Month Management](#month-management)
14. [Health Score](#health-score)
15. [Settings](#settings)
16. [Privacy & Security (PIN Lock)](#privacy--security-pin-lock)
17. [Dark Mode](#dark-mode)
18. [Data: Export, Import & Reset](#data-export-import--reset)
19. [AI Insights (Claude / OpenAI)](#ai-insights-claude--openai)
20. [Installing as an App (PWA)](#installing-as-an-app-pwa)
21. [Tips & Power-User Features](#tips--power-user-features)

---

## Getting Started

Open `src/index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No installation, no server, no account required.

On first launch you will see the **Setup Wizard**. If you want to explore before committing, the app loads sample demo data — you can reset it at any time from Settings.

---

## First-Time Setup Wizard

The 8-step wizard runs automatically on first launch. Every step except the first can be skipped and filled in later.

| Step | What you do |
|------|-------------|
| 0 — Welcome | Read the intro, press **Get Started** |
| 1 — Name & Currency | Type your name (optional) and choose your currency from the dropdown |
| 2 — Income sources | Enter each income source (salary, freelance, etc.) with its amount, press **+** or **Enter** after each |
| 3 — Expenses | Add recurring bills — name, amount, which week it falls in, optional due day and note |
| 4 — Loans & debts | Add credit cards, car loans, student debt — balance, interest rate, minimum payment |
| 5 — Savings goals | Add goals (Emergency Fund, Vacation, etc.) with target amount, current balance, monthly contribution and interest rate |
| 6 — PIN (optional) | Set a 4-digit PIN to lock the app when you close it |
| 7 — Done | Press **Open Dashboard** |

**To redo the wizard:** go to Settings → Danger Zone → Reset to Demo, which clears all data and restarts the wizard.

---

## Navigating the App

The **top bar** contains:

- **FinFlow logo** (left) — returns to the Dashboard tab
- **Month navigator** (← May 2025 →) — step backward or forward one month at a time
- **Health badge** (e.g. "82 · Good") — click it to see the score breakdown
- **Dark mode toggle** (🌙/☀)
- **Settings gear** (⚙)

The **tab bar** below the topbar switches between sections:

`Dashboard · Expenses · Income · Loans · Savings · Calendar · Analytics · Archive`

On mobile the topbar collapses into a hamburger menu.

---

## Dashboard

The Dashboard is the home screen. It shows a real-time snapshot of the current month.

### KPI strip

Four metric cards across the top:

| Card | What it shows |
|------|---------------|
| **Total Expenses** | Sum of all expense items for the month, with paid vs. pending breakdown |
| **Total Income** | Sum of all income sources, with received vs. pending |
| **Net Cash Flow** | Income minus expenses (green = surplus, red = shortfall) |
| **Loans / Min Pmts** | Total outstanding debt and combined minimum monthly payments |

### Shortfall warning

If expenses exceed income the dashboard shows a red shortfall banner with the exact gap. A yellow banner appears when the margin is tight (under 10%).

### Savings snapshot

A compact summary of your savings goals with progress bars and balances appears below the KPIs.

### Budget envelopes (ring chart)

A donut chart shows spending by category vs. budget caps. Rings that are full or over-budget turn red.

### Bill list

Upcoming unpaid bills sorted by due date, pulled from the Expenses tab.

### Month-complete celebration

When every expense is paid and every income source is marked received, a green celebration banner appears.

---

## Expenses

The Expenses tab organises bills into **weekly cards** (Week 1 – Week 4).

### Adding an expense

1. Click **+ Add Item** at the bottom of any week card, or click the **✎ pencil** icon on an existing row.
2. The **Item Modal** opens with these fields:

| Field | Notes |
|-------|-------|
| Name | Free text, e.g. "Netflix" |
| Amount | Dollar amount |
| Category | Choose from Banking, Telecom, Auto, Utilities, Health, Loan Pmt, Savings, Other — or a custom category |
| Status | Pending / Paid / Skipped |
| Due day | Pick a calendar day (1–31) using the day-picker grid |
| Note | A short note stored with the item (shown inline below the name) |
| Receipt | Attach a photo — tap the upload zone or drag an image file |

3. Press **Save**.

### Editing an expense

Click the item name or the pencil icon on any row. The same modal opens pre-filled.

### Marking paid / unpaid

Click the **status badge** on any row (the coloured Pending/Paid/Skipped chip) to cycle through statuses without opening the modal. The row highlights green when paid.

### Bulk mark paid

Click **Mark all paid** in a week card header to mark every unpaid item in that week as paid at once.

### Deleting an expense

Open the item modal → scroll to **Delete** → confirm. Or use the delete button (×) on the row.

### Drag to reorder

Grab any expense row by its left edge and drag it to a new position within the same week.

### Recurring detection

FinFlow watches for items with the same name across multiple months. If it detects a recurring pattern it shows a **↻ badge** on the item. The **Auto-fill recurring** button (top of Expenses) pre-populates the current month with all detected recurring bills in one click.

### Tag filter

Use the tag/category filter chips above the expense list to show only items of a specific category.

### Category badges

Each item shows a colour-coded category badge. Click the badge to change the category inline.

### Notes & receipts inline

If an item has a note it shows in a subtle gold strip below the item name. If it has a receipt a small thumbnail appears — click it to view full size.

---

## Income (Revenue)

The Income tab tracks money coming in each month.

### Adding an income source

Click **+ Add Income** → fill in:

| Field | Notes |
|-------|-------|
| Name | e.g. "Salary", "Freelance Project" |
| Amount | Expected amount |
| Status | Pending / Received |

Press **Save**.

### Marking received

Click the income row or the pencil icon. Change status to **Received** and save. Received rows turn green. Alternatively, click the status chip directly on the table row.

### Editing / deleting

Click the pencil icon on any row. The income modal opens pre-filled with a **Delete** option at the bottom.

### Multi-month history table

The income section shows a rolling table of the last 12 months (configurable with the toggle buttons: 3 / 6 / 12 months). Each cell is click-to-edit — click an amount directly in the table to update it without opening the modal.

---

## Loans

The Loans tab tracks outstanding debts and calculates payoff timelines.

### Adding a loan

Click **+ Add Loan** → fill in:

| Field | Notes |
|-------|-------|
| Name | e.g. "Visa Card", "Car Loan" |
| Current balance | Outstanding amount |
| Interest rate | Annual percentage rate |
| Minimum payment | Required monthly payment |

Press **Save**.

### Loan card

Each loan shows:
- Balance, interest rate, minimum payment
- Months remaining to payoff (at minimum payment)
- Estimated payoff date
- Payment history (collapsible list of months)

### Editing a loan balance

Click **Edit balance** on the loan card to update the current balance directly (e.g. after making a payment).

### Payment history

Click **+ Add payment month** to log a payment for the current month. Click the payment row to toggle it paid/unpaid.

### Paydown strategies

In the Loans section header choose a strategy:

| Strategy | How it works |
|----------|-------------|
| **Avalanche** | Pay off highest-interest debt first — minimises total interest paid |
| **Snowball** | Pay off smallest balance first — builds psychological momentum |

A recommended payoff order is shown based on your chosen strategy.

### Paydown calculator (slider)

The **Extra payment slider** at the bottom of the Loans tab lets you model what happens if you add an extra $50–$2,000/month. The months-to-payoff and total interest figures update in real time.

### Standalone loan calculator

Use the **Loan Calculator** panel (balance, rate, payment inputs) to run what-if scenarios without affecting your actual loan data.

### Debt-free celebration

When all loans reach a $0 balance, a special debt-free card and confetti appear.

---

## Savings Goals

The Savings tab tracks progress toward financial goals.

### Adding a goal

Click **+ Add Goal** → fill in:

| Field | Notes |
|-------|-------|
| Name | e.g. "Emergency Fund", "Vacation" |
| Target amount | The finish line |
| Current balance | What you have saved right now |
| Monthly contribution | How much you plan to add each month |
| Interest rate | Annual rate (e.g. HYSA rate) — used to project growth |

Press **Save**.

### Goal progress card

Each card shows:
- Balance vs. target with a progress bar
- Estimated months to reach target
- Monthly contribution and interest rate
- A **Deposit** and **Withdraw** button

### Logging a transaction

Click **Deposit** or **Withdraw** on a goal card. Enter an amount and optional note. The balance updates immediately and the change is saved.

### Editing a goal

Click the **Edit** button on the goal card. Same modal opens pre-filled. You can also update the name, target, contribution, or rate.

### Deleting a goal

Open the Edit modal → **Delete Goal** → confirm.

### Custom / non-financial goals

The Savings section has a separate **Custom Goals** panel for tracking anything non-monetary: habits, streak days, steps walked, milestones. These display as progress cards alongside your savings goals.

---

## Bill Calendar

The Calendar tab shows a monthly grid view with all expense due dates overlaid as chips.

- **Green chip** = bill is paid
- **Amber chip** = bill is due and unpaid
- **Grey chip** = bill has no due date set

Click any chip to open that expense item's edit modal.

Bills without a due day set will not appear on the calendar — set a due day in the Item Modal to make them show up.

---

## Analytics & Insights

The Analytics tab gives you a historical view across months.

### Charts available

| Chart | Description |
|-------|-------------|
| **Net cash flow** | Bar chart — income vs. expenses by month |
| **Expense summary** | Donut chart — spending by category for the current period |
| **Income trend** | Line chart — income over time |
| **Category trends** | Multi-line chart — each category's spending trajectory |
| **Savings growth** | Area chart — savings balance over time |
| **Loan paydown** | Area chart — total debt decreasing over time |

### Period selector

Use the toggle buttons above the charts to choose a time window (3 / 6 / 12 months).

### Variance table

A table below the charts shows each month's expenses, income, net, and variance from the prior month — useful for spotting seasonal patterns.

### Month comparison

Click **Compare Months** (top of Analytics) to open a side-by-side comparison modal. Pick any two months from your history to see expenses, income, and net flow side by side.

### Category manager

Click **Manage Categories** to add, rename, or delete custom expense categories. Custom categories appear in the item modal's category pill picker.

### AI insights

If you've connected Claude or OpenAI (see [AI Insights](#ai-insights-claude--openai)), a **Generate Insights** panel appears with mode buttons:

- **Summary** — plain-language overview of the month
- **Advice** — actionable recommendations based on your data
- **Deep dive** — detailed month-by-month analysis
- **Forecast** — projected next-month figures based on trends

---

## Month Archive

The Archive tab stores closed months so your Dashboard stays focused on the current month.

### Archiving a month

1. In the Archive tab, click **Archive** next to any past month.
2. Confirm the action.
3. The month moves to the archive and disappears from the month navigation tabs.

### Auto-archive

In Settings you can set an **auto-archive threshold** (e.g. 3 months). Any month older than this threshold is archived automatically on app load.

### Viewing archived months

Archived months appear in the Archive tab grouped by year. Expand any group to see that year's months with summary figures (income, expenses, net).

### Restoring an archived month

Click **Restore** next to any archived month to bring it back to the active month navigation.

### Deleting an archived month permanently

Click the delete (×) button on an archived month. This is irreversible.

---

## Budget Envelopes

Envelopes are per-category spending caps. They appear on the Dashboard and Expenses tab as a donut ring grid.

### Setting a cap

Click any envelope card. Enter a monthly cap and press **Save**. The default caps are:

| Category | Default cap |
|----------|-------------|
| Banking | $100 |
| Telecom | $300 |
| Auto | $600 |
| Utilities | $250 |
| Health | $200 |
| Loan Pmt | $2,500 |
| Savings | $500 |
| Other | $300 |

### Rollover

Toggle **Rollover** on any envelope to carry unspent budget forward to the next month. If you spent less than your cap this month, the surplus is added to next month's cap automatically when you create a new month.

### Reading the envelopes

- The coloured ring fills as you spend within the category
- An **over-budget** ring turns red and shows the excess amount
- The ring resets each month

---

## Month Management

### Navigating months

Use the **← →** arrows in the top bar to move between months. The month label (e.g. "May 2025") updates as you navigate.

### Month tags

The row of month tags below the topbar (Jan · Feb · Mar …) shows all active months. Click any tag to jump directly to that month. The current month is highlighted.

### Creating a new month

Click **+ New Month** in the month manager bar. Choose a month/year from the dropdowns and press **Create**. The new month starts empty unless you use Clone.

### Cloning a month

Click **Clone** in the month manager bar. Choose which data to copy:

- **Expenses** — copies all expense items (amounts, names, categories, due days) but resets paid status to Pending
- **Revenue** — copies all income sources but resets received status to Pending
- **Keep paid status** — optionally preserve which items were already marked paid

This is the fastest way to set up a new month if your bills are mostly the same each month.

### Deleting a month

Click the **×** next to any month tag → confirm. Deleted months cannot be recovered (archive them first if you want to keep the data).

---

## Health Score

The Health Score (0–100) appears as a badge in the top bar. Click it to open the score breakdown.

### How it's calculated

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| **Budget adherence** | High | How well spending stays within envelope caps |
| **Savings rate** | High | Savings contribution as % of income |
| **Debt-to-income** | Medium | Total minimum payments vs. income |
| **Income coverage** | Medium | Whether income covers all expenses |
| **Emergency fund** | Medium | Whether you have a fully-funded emergency goal |
| **Paid on time** | Lower | % of bills marked paid vs. total |

### Score tiers

| Score | Label |
|-------|-------|
| 90–100 | Excellent |
| 75–89 | Good |
| 55–74 | Fair |
| 0–54 | Needs work |

A perfect 100 turns the badge gold with a special animation.

---

## Settings

Open Settings by clicking the **⚙ gear** in the top bar (or from the mobile menu).

### Currency

Change your display currency. Supported currencies include CAD, USD, GBP, EUR, AUD, and many more. If you enable live FX rates (requires internet), amounts entered in a foreign currency are converted to your home currency automatically.

### Notifications

Toggle **Bill reminders** on to receive browser notifications for upcoming due dates. The browser will ask for notification permission the first time.

### PIN

- **Set PIN** — opens the PIN setup pad (enter a 4-digit PIN twice to confirm)
- **Remove PIN** — removes the PIN after confirming the current one

### Export data

Click **Export JSON** to download a complete backup of all your data as a `.json` file. Keep this file somewhere safe.

### Import data

Click **Import** and select a previously exported `.json` file to restore your data. This replaces all current data.

### CSV import

Click **Import CSV** to import expenses from a spreadsheet export. Map columns (name, amount, date, category) in the preview step before confirming.

### Reset sections

In the Danger Zone at the bottom of Settings you can selectively wipe:

- **Expenses** — clears all expense items for all months
- **Revenue** — clears all income sources
- **Loans** — removes all loan records
- **Savings** — removes all savings goals

Each reset requires typing the word **RESET** to confirm.

### Full reset

**Reset to Demo** wipes everything and reloads the demo data, then re-runs the Setup Wizard.

---

## Privacy & Security (PIN Lock)

FinFlow stores all data in your browser's **IndexedDB** — it never leaves your device. No account, no cloud sync, no third-party tracking.

### Setting up a PIN

1. Open Settings → **Set PIN**
2. Enter a 4-digit PIN on the pad
3. Enter it again to confirm
4. Done — the app will lock on next load

### Unlocking

Enter your 4-digit PIN on the lock screen. There is no "forgot PIN" recovery — if you forget your PIN you must use the browser's DevTools to clear IndexedDB storage (which also clears your data). **Export your data regularly as a backup.**

### Changing a PIN

Settings → Set PIN → enter a new PIN. The old PIN is replaced immediately.

### Removing a PIN

Settings → Remove PIN → enter your current PIN to confirm removal.

---

## Dark Mode

Click the **🌙 moon icon** in the top bar to switch to dark mode. Click the **☀ sun** to return to light mode. Your preference is saved and restored automatically on next load — the dark mode is applied before the page renders to prevent a flash of light.

---

## Data: Export, Import & Reset

### Full export

Settings → **Export JSON** → a `.json` file downloads containing:
- All months (active + archived)
- All income sources
- All loan records
- All savings goals and custom goals
- Your budget caps, currency settings, and preferences

### Full import

Settings → **Import** → select a `.json` export file → data is loaded immediately. This **replaces** your existing data, so export first if you have anything you want to keep.

### CSV import (expenses only)

Settings → **Import CSV**:
1. Drag a CSV file onto the drop zone or click to browse
2. A preview table shows the first rows with column mapping
3. Rows that can't be matched are shown greyed out (skipped)
4. Press **Import X items** to confirm

The CSV importer expects at minimum a name/description column and an amount column. A date column is used to assign items to the correct week.

---

## AI Insights (Claude / OpenAI)

FinFlow can send an anonymised summary of your financial data to the Claude or OpenAI API to generate advice and forecasts. **Your actual transaction names and amounts are included in the prompt — only connect an API key you trust.**

### Connecting Claude

1. Analytics tab → **Connect AI** button
2. Select the **Claude** tab
3. Paste your Anthropic API key
4. Press **Connect**

### Connecting OpenAI

Same as above but select the **OpenAI** tab.

### Switching providers

Once both keys are saved, use the **Claude / OpenAI** toggle buttons to switch the active provider.

### Running an insight

1. Make sure you're on the Analytics tab
2. Press **Generate Insights** and choose a mode:
   - **Summary** — what happened this month in plain English
   - **Advice** — specific recommendations for your situation
   - **Deep dive** — detailed multi-month analysis
   - **Forecast** — predicted income, expenses and savings next month
3. The response streams in below the chart area

### Removing an API key

Settings → AI section → **Remove** next to the provider. The key is deleted from localStorage.

---

## Installing as an App (PWA)

FinFlow is a Progressive Web App. When served over HTTPS (e.g. via GitHub Pages or a local server), browsers offer an **Install** prompt.

- **Chrome / Edge:** look for the install icon in the address bar
- **Safari on iOS:** Share → Add to Home Screen
- **Android Chrome:** browser menu → Add to Home Screen

Once installed it runs in standalone mode (no browser chrome) and works fully offline using the service worker cache.

---

## Tips & Power-User Features

### Recurring auto-fill

If you track the same bills every month (Netflix, rent, utilities), use **Auto-fill recurring** at the top of the Expenses tab. FinFlow detects names that have appeared in 2+ prior months and adds them to the current month in one click — saving you from re-entering them manually.

### Clone instead of re-entering

When you create a new month, use **Clone** and select "Expenses + Revenue" to copy last month's structure instantly. Amounts and due days carry over; paid/received statuses reset to Pending.

### Due day grid

Set a due day on any expense to make it appear on the Bill Calendar and in the Dashboard's upcoming bills list. The day-picker in the item modal shows a 1–31 grid — just tap the day.

### Inline editing

You can edit an expense **name** directly by clicking on it in the table (no modal needed). Same for income amounts in the multi-month history table.

### Drag-to-reorder expenses

Grab any expense row by its drag handle and drop it into a different position in the week. FinFlow saves the order.

### Budget rollover

Enable rollover on budget envelopes to carry unspent caps into the next month. Useful for irregular expenses (e.g. a car maintenance budget that builds up over time).

### Month comparison

Use **Compare Months** in Analytics to put any two months side-by-side — useful for spotting creep in specific categories or comparing a good month vs. a bad one.

### Export before big changes

Always export your data (Settings → Export JSON) before importing, running a full reset, or making bulk edits. The export is your safety net.

### Keyboard navigation

The app supports keyboard navigation throughout. The tab order follows the visual layout, and all modals trap focus so the Tab key cycles only within the open modal. Press **Escape** to close any modal.

### Offline use

After the first load the service worker caches all app files. You can open the app with no internet connection and all data will be there — it's stored in IndexedDB on your device.

### Print view

Press **Ctrl+P** (or **⌘+P** on Mac) to print the current tab's content. Print-only elements are hidden and the layout switches to a clean single-column format.

---

## Data Storage

| What | Where |
|------|-------|
| All financial data | Browser IndexedDB (`FinFlow` database) |
| Dark mode preference | `localStorage` |
| PIN hash | IndexedDB (`meta` store) |
| API keys | `localStorage` (base64 encoded) |
| Currency preference | Saved within the main state object in IndexedDB |

Clearing browser site data will erase everything. Export regularly.

---

*FinFlow is a client-side app — your data never leaves your browser.*
