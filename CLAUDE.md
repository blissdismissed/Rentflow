# Rentflow — CLAUDE.md

## Project Overview
Rentflow is a property management platform for short-term rentals. The owner (Arthur Autz) manages two properties:
- **Bromley Mountain, VT** — ski condo, managed through Bromley Mountain resort (HOA-style billing). Uses itemized expense tracking.
- **Myrtle Beach, SC (Caribbean Resorts)** — managed via Caribbean Resorts. Income/expenses from monthly PDF statements.

**Live site**: https://aspiretowards.com  
**EC2 user**: ec2-user@ip-172-31-35-44  
**App path on EC2**: /var/www/aspiretowards/Rentflow/backend  
**Static frontend**: hosted on S3 (sync via AWS CLI after editing public/ files)  
**Process manager**: pm2 (`pm2 restart rentflow-api`)

---

## Architecture

### Stack
- **Backend**: Node.js + Express, running on EC2
- **Database**: PostgreSQL on EC2 (`rentflow_db`, user `at_user`)
- **ORM**: Sequelize (camelCase field names — columns are camelCase in DB, NOT snake_case)
- **Frontend**: Vanilla JS + Tailwind CSS, static HTML files on S3
- **Auth**: JWT tokens via Passport.js
- **Email import**: Resend webhooks → `/api/import/email` → `emailImportController.js`
- **PDF parsing**: `pdf-parse` v2.4.5 (class-based API: `new PDFParse({ data: buffer })`, `parser.getText()`)

### Key directories
```
backend/src/
  controllers/    — financialController.js (main), emailImportController.js, etc.
  models/         — Sequelize models
  routes/         — Express routers
  config/         — database.js, passport.js
public/           — all frontend HTML (dashboard.html is the big one)
```

### Frontend architecture
All financial UI lives in `public/dashboard.html`. It's a single-page app with tab switching. Key state object:
```javascript
finState = {
  propertyId, year, summaryData, yearData,
  editingExpenseId, bromleyParsed,
  pendingStmtSelected, pendingStmtPropertyId  // WTR split modal state
}
importState = { rows, bromleyParsed, caribbeanBatch, pendingStmtSelected, ... }
```

---

## Financial Module (main feature area)

### Two property types
- **Itemized (Vermont/Bromley)**: expense items tracked individually via `FinancialExpenseItem`. `dataSource !== 'caribbean'`.
- **Caribbean**: income/expenses from monthly PDF statements, stored in `FinancialMonthly`.

### Key models
| Model | Purpose |
|---|---|
| `FinancialMonthly` | Monthly income/expense summary rows |
| `FinancialExpenseItem` | Individual expense line items (tag: utilities/housekeeping/maintenance/hoa/other). Has `qty` column for labor hours. |
| `FinancialAnnualConfig` | Per-year scheduled mortgage, taxes & insurance, notes |
| `PropertyFinancialSettings` | purchasePrice, dataSource, wtrSplitMode |
| `FinancialBookingTransaction` | Booking-level income from Evolve CSV imports |

**IMPORTANT**: Sequelize model field names are camelCase. The DB columns are also camelCase (e.g., `purchasePrice` not `purchase_price`). **Exception**: `wtr_split_mode` column was initially added as snake_case by mistake — the actual column must be `"wtrSplitMode"`.

### PDF Import flows
1. **Manual upload** (dashboard): `parseBromleyPdf` → `parseBromleyText()` → preview → `confirmImport()`
2. **Email import**: Resend webhook → `emailImportController.js` → `parseBromleyText()` → `saveBromleyData()`

### Bromley PDF types (auto-detected by `parseBromleyText`)
- **Cleaning invoice**: line items with labor hours (qty field). Smart-saves: replaces statement scaffold rows for same cleaning date.
- **Regular invoice**: HOA, maintenance charges. Split across months.
- **Statement of account**: list of open invoices. Detected by `/^\s*STATEMENT/m`. 

### Statement parser (CRITICAL)
pdf-parse v2.4.5 outputs Bromley statements as **tab-delimited** columns in this order (NOT visual left-to-right):
```
DUE_DATE \t REFERENCE \t IN \t BILLING_DATE \t DOC_NUMBER AMOUNT
```
Total appears as `467.03\tTotal:` (amount BEFORE the label).

The parser is in `financialController.js` → `parseBromleyText()` → `isStatement` branch.

### Scaffold pattern
When a statement imports an S/C/M cleaning entry (summary), it saves with `amount=0` as a scaffold.
When the cleaning invoice arrives later, `smartSaveBromleyItems` zeros the scaffold and creates detail rows.
Frontend filters out scaffold rows: `vendor=bromley`, `tag=housekeeping`, `expenseName` starts with `S/C/M`, `amount=0`.

### WTR/SWR quarterly billing
References like `WTR/SWR OCT-DEC2025_53` cover 3 months. The statement billing date is ~1 month before service period.
- On manual import: prompts user with modal (first month / split evenly / last month). Default from `PropertyFinancialSettings.wtrSplitMode`.
- On email import: always splits evenly.
- Pattern to detect: `/WTR\/SWR\s+([A-Z]{3})-([A-Z]{3})(\d{2,4})/i`

---

## Deployment

### After backend changes
```bash
# On EC2
cd /var/www/aspiretowards/Rentflow
git pull origin finance-module
pm2 restart rentflow-api
```

### After frontend changes (public/ files)
```bash
# Push to S3 (run locally or from EC2)
aws s3 sync public/ s3://[bucket-name]/ --exclude "*.DS_Store"
```

### Database migrations (must run manually on EC2)
```bash
psql -U at_user -d rentflow_db -c "ALTER TABLE ..."
```
Sequelize sync is disabled in production (`alter: false`). All schema changes need manual ALTER TABLE.

### Past migrations run
```sql
-- qty for labor hours on expense items
ALTER TABLE financial_expense_items ADD COLUMN IF NOT EXISTS qty DECIMAL(10,4) NULL;

-- wtrSplitMode for property settings (NOTE: camelCase column name required)
ALTER TABLE property_financial_settings ADD COLUMN IF NOT EXISTS "wtrSplitMode" VARCHAR(10) DEFAULT 'split';
```

---

## Active Branch
`finance-module` — contains all financial module work. Not yet merged to master.

Other branches: `add-calendar-functionality` (paused), `master` (stable).

---

## Key UI Components (dashboard.html)

### Financial views
- **All-years summary** (`fin-summary-view`): stat cards + summary table + analytics + Property Settings section
- **Year detail** (`fin-year-view`): monthly table + analytics + itemized expense list + Utility Tracker button

### Modals
- `fin-month-modal` — edit monthly data. Month dropdown has `onchange="loadMonthDataIntoModal()"` so switching month re-populates.
- `fin-expense-modal` — add/edit individual expense items
- `fin-wtr-split-modal` — choose how to distribute WTR/SWR quarterly bill (first/split/last)
- `fin-utility-modal` — Utility Tracker: 12-month × 4-utility grid (Internet, Electric, Water, Sewer)
- `fin-import-modal` — CSV/PDF import wizard
- `fin-annual-modal` — mortgage & T&I per year

### Utility Tracker
Opened via "Utility Tracker" button next to "+ Add Expense" (Vermont only). Shows which months are missing Internet/Electric/Water/Sewer. Clicking "+" closes tracker and opens expense modal pre-filled. Tracker auto-closes when year changes.

### Cleaning analytics
Shown in year view for Bromley. Groups expense items by `expenseDate` and `vendor=bromley` + `tag=housekeeping`. Shows avg cost, avg labor hours, avg hourly rate.

---

## Important Behavioral Notes
- **Do not call `loadFinYear` directly after import** — call `loadFinSummary()` then `setFinView('year')` so the year dropdown rebuilds from summary data.
- **`isItemized(data)`** returns `data?.dataSource !== 'caribbean'`
- **`|| ''` gotcha**: `0 || ''` gives empty string. Month modal uses this intentionally so zero-value fields show as blank (no manual entry yet).
- **pdf-parse API**: v2.4.5 uses `new PDFParse({data: buffer})` + `await parser.getText()` + `await parser.destroy()` — NOT the old function call style.
- **Email from sender**: arthur.autz@gmail.com or aspiretowards@gmail.com routes to the correct user account.
