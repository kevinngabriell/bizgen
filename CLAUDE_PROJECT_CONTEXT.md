# BizGen — Claude Project Context

## What is BizGen

BizGen is a **B2B ERP web application** built for trading/forwarding companies. It covers the full business cycle: Sales (inquiry → quotation → booking → sales order → delivery order → invoice → profit summary) and Purchase (requisition → local/import PO → goods receipt → invoice). It also has Finance, Warehouse, HR, Analytics, and Settings modules.

**Stack:**
- Next.js 16 (App Router, `'use client'` pages)
- React 19
- TypeScript 5
- Chakra UI v3 (primary component library)
- Ant Design v6 (secondary, some tables/selects)
- Tailwind CSS (utility classes)
- Recharts (charts)
- `xlsx` (Excel export)
- `jwt-decode` (token parsing)
- Lucide React + React Icons

---

## Repository Structure

```
bizgen/
├── app/
│   ├── bizgen/
│   │   ├── sales/          # Sales module pages
│   │   ├── purchase/       # Purchase module pages
│   │   ├── finance/        # Finance pages
│   │   ├── warehouse/      # Warehouse pages
│   │   ├── settings/       # Master data settings pages
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   ├── document/
│   │   ├── hr/
│   │   └── profile/
│   ├── login/ register/ forgot-password/
│   └── layout.tsx
├── components/
│   ├── ui/                 # SidebarWithHeader, TopNavBar, Chakra UI wrappers
│   ├── dialog/             # Reusable dialogs (Reject, DataChangeConfirm, etc.)
│   ├── lookup/             # Lookup popups (Customer, Supplier, PurchaseOrder, etc.)
│   └── announcement/
├── lib/
│   ├── auth/               # Auth, token decode, role checks
│   ├── sales/              # Sales API functions + TypeScript interfaces
│   ├── purchase/           # Purchase API functions + TypeScript interfaces
│   ├── master/             # Master data API functions (customer, supplier, item, etc.)
│   ├── finance/            # Finance API functions
│   ├── warehouse/          # Warehouse API functions
│   ├── settings/           # Company settings API functions
│   ├── system/             # System-level (announcements)
│   ├── services.ts         # Bizgen service listing (external: getmovira.com)
│   ├── i18n.ts             # Localization (en/id)
│   └── utils.ts
└── locales/en/ locales/id/ # Translation strings
```

---

## API Convention

All API calls live in `lib/` as plain async functions. Pattern is consistent across all modules:

```ts
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const token = localStorage.getItem('token');

const res = await fetch(`${baseUrl}<module>/<endpoint>.php`, {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(input),   // POST/PUT only
});
const json = await res.json();
if (json.status_code !== 200) throw new Error(json.status_message);
return json.data;
```

- Auth: JWT in `localStorage` under key `'token'`
- All endpoints return `{ status_code, status_message, data }`
- List endpoints return `{ data: { data: [], pagination: {} } }`
- Detail endpoints return `{ data: { header: {}, items: [], history: [] } }`

---

## Sales Module (`lib/sales/` + `app/bizgen/sales/`)

| File | Endpoint | Purpose |
|------|----------|---------|
| `rfq.ts` | `sales/rfq.php` | Request for Quotation / Inquiry |
| `quotation.ts` | `sales/quotations.php` | Sales Quotation |
| `booking-confirmation.ts` | `sales/job-orders.php` | Booking Confirmation (Job Order) |
| `sales-order.ts` | `sales/sales-orders.php` | Sales Order |
| `delivery-order.ts` | `sales/delivery-orders.php` | Delivery Order |
| `invoice.ts` | `sales/invoices.php` | Sales Invoice |
| `costing.ts` | `sales/costing.php` | Costing & Expenses |
| `profit.ts` | `sales/profit-summary.php` | Profit Summary |
| `document.ts` | `sales/documents.php` | Document management |

**Number generation:** `sales/generate-number.php?module_name=<invoice|sales_order|delivery_order|...>`

**Approval flow** (all sales documents): `draft → submit → approve/reject`
- Action via PUT with `?action=submit|approve|reject`
- Body includes document ID + optional notes

**Export:** Sales Order supports PDF (`?action=export_pdf`) and Excel (`sales/report/sales-order.php`)

---

## Purchase Module (`lib/purchase/` + `app/bizgen/purchase/`)

| File | Endpoint | Purpose |
|------|----------|---------|
| `requisition.ts` | `purchase/requisitions.php` | Purchase Requisition |
| `local.ts` | `purchase/purchase-orders.php?type=local` | Local Purchase Order |
| `import.ts` | `purchase/purchase-orders.php?type=import` | Import Purchase Order |
| `goods-receipt.ts` | `purchase/receiving.php` | Goods Receipt (Receiving Items) |
| `invoice.ts` | `purchase/invoices.php` | Purchase Invoice |
| `quotation.ts` | `purchase/quotations.php` | Request for Quotation |

**Number generation:** `purchase/generate-number.php?module_name=<local|import|goods_receipt|invoice|...>`

**Local PO** key fields: `supplier_id`, `payment_id`, `po_date`, `delivery_date`, items with `qty` + `unit_price`

**Import PO** key fields: `supplier_id`, `shipment_period_id`, `term_id`, `payment_method_id`, `origin_id`, `destination_id`, `currency_id`, `exchange_rate_to_idr`, items with `packaging_size`

**Goods Receipt** links to either a Local PO or Import PO via `purchase_id_local` / `purchase_id_import`

**Purchase Invoice** links to either a Local PO or Import PO via `purchase_id_local` / `purchase_id_import`

---

## Master Data (`lib/master/`)

| Master | Key identifier |
|--------|---------------|
| Customer | `customer_id` |
| Supplier | `supplier_id` |
| Item (Product) | `item_id` |
| UOM | `uom_id` |
| Currency | `currency_id`, `currency_code` |
| Tax | `tax_id`, `tax_percent` |
| Term | `term_id` |
| Payment Method | `payment_id` |
| Ship Via | `ship_via_id` |
| Port | `port_id` |
| Origin | `origin_id` |
| Warehouse | `warehouse_id` |
| Commodity | `commodity_id` |
| Shipment Period | `shipment_period_id` |
| Incoterm | `incoterm_id` |
| Account Code | `account_code_id` |
| Bank Account | `bank_account_id` |

---

## Authentication & Roles

- Auth: `lib/auth/auth.ts`
- Token decoded via `jwt-decode` → `DecodedAuthToken` (contains `app_role_id`, user info)
- `checkAuthOrRedirect()` — redirects to `/login` if no valid token
- `SALES_APPROVAL_ROLES` — set of role IDs that can approve/reject documents
- `getAuthInfo()` — returns decoded token from localStorage

---

## Page Pattern

Every page follows this structure:

```tsx
'use client';
// Imports: Chakra UI, lib functions, components

export default function PageName() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  // mode: 'create' | 'view'
  // Load master data on mount (currencies, items, terms, etc.)
  // Form state as useState
  // Submit → API call → toast/alert feedback

  return (
    <SidebarWithHeader>
      {/* Page body using Chakra UI Stack, SimpleGrid, Card, etc. */}
    </SidebarWithHeader>
  );
}
```

- `SidebarWithHeader` wraps every authenticated page
- All forms are controlled components with `useState`
- Item tables: dynamic rows with add/delete, auto-calc totals
- `BIZGEN_COLOR = '#E77A1F'` — brand orange color used for buttons, badges
- Detail pages use `?id=<id>` or `?invoice_id=<id>` query params to switch create/view mode

---

## Lookup Components (`components/lookup/`)

Reusable modal pickers that search and return a selected record:
- `CustomerLookup` — picks a customer
- `SupplierLookup` — picks a supplier
- `PurchaseOrderLookup` — picks a purchase order (local or import), returns PO items
- `SalesOrderLookup` — picks a sales order
- `DeliveryOrderLookup` — picks a delivery order
- `SalesInquiryLookup` — picks an inquiry/RFQ
- `SalesJoborderLookup` — picks a job order

---

## Localization

- Two languages: English (`en`) and Indonesian (`id`)
- `lib/i18n.ts` + `locales/en/common.ts` + `locales/id/common.ts`
- Usage: `const t = getLang(lang); const tr = t.<module_key>;`
- Language preference stored in localStorage

---

## Current Status (as of 2026-04-25)

### Completed modules
- **Sales:** Inquiry/RFQ, Quotation, Booking Confirmation, Sales Order, Delivery Order, Sales Invoice, Costing & Expense, Profit Summary — all CRUD + approval flow
- **Purchase:** Purchase Requisition, Local PO, Import PO, Goods Receipt, Purchase Invoice — all CRUD + approval flow
- **Warehouse:** Stock In, Stock Out, Find Stock, Sample
- **Finance:** Create Income, Create Expenses, Create Invoice, Create Vendor Bill
- **Settings (Master Data):** Customer, Supplier, Items, UOM, Currency, Tax, Term, Payment Method, Ship Via, Port, Origin, Warehouse, Commodity, Shipment Period, Account Code, Bank Account, Company, Users

### In progress / recently changed (git status)
- `app/bizgen/purchase/purchase-invoice/page.tsx` — purchase invoice page updates
- `app/bizgen/purchase/receiving-items/page.tsx` — goods receipt page updates
- `lib/purchase/goods-receipt.ts` — goods receipt lib
- `lib/purchase/import.ts` — import PO lib
- `lib/purchase/invoice.ts` — purchase invoice lib
- `lib/purchase/local.ts` — local PO lib

---

## Development Notes

- **No ORM / no database access from frontend** — all data via PHP REST API at `NEXT_PUBLIC_API_URL`
- **No global state manager** — each page manages its own state with `useState`
- **No custom hooks** for business logic — logic lives inside page components
- **Line total calculation** is done client-side on item row change, then sent to API
- `tax_amount` / `ppn` calculations done locally before submission
- Excel export uses `xlsx` library, PDF export via API blob response
- `deletePurchaseInvoice` — hard delete (no soft delete pattern seen)
- Approval statuses flow: `draft → submitted → approved` (or `rejected`)
