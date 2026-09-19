# Invoice Generator — Samraddhi Mattresses (Full Stack, Production-Ready)

Full-stack GST Invoice Generator: **Next.js (App Router) + MUI** frontend aur **Node/Express + MongoDB + Puppeteer** backend. Har invoice ek hi PDF me 3 copies (Original / Duplicate / Triplicate) me generate hota hai, bilkul Sunrise Foam Industries ke sample invoice jaisa format.

## Ismein Kya Naya Hai (v2)

| Cheez | Detail |
|---|---|
| **Env-based backend URL** | Frontend me backend URL kahin bhi hardcoded nahi hai — `frontend/.env.local` me `BACKEND_URL` se aata hai (`next.config.js` isko proxy karta hai). |
| **Do invoice types, ek hi form** | Naye invoice form ke upar **Customer Invoice** (Aadhar + PAN) aur **Dealer Invoice** (GSTIN + Dealer Code) — 2 tabs. Dono ke Bill To/Ship To fields alag hain, baaki form same rehta hai. |
| **Preview ab dialog me hai** | Pehle preview page ke neeche iframe me aata tha — ab ek proper popup **Dialog** me khulta hai (mobile pe fullscreen), "Open in New Tab / Print" button ke saath. |
| **Navbar + Logo + Add button** | Navbar me Samraddhi Mattresses ka asli logo, responsive hamburger menu (mobile), aur ek quick **"+ New"** button top-right me. |
| **Fast, server-side pagination** | Saved Invoices table ab backend se page-by-page data leti hai (MongoDB `skip/limit`), search + type filter + sort ke saath — 10,000 invoices ho tab bhi table fast rahegi. |
| **Smart caching (React Query)** | Ek baar jo page/data load ho gaya wo cache me rehta hai — tab switch karo ya wapas aao, dobara network call nahi hoti jab tak data purana (stale) na ho ya koi invoice create/update/delete na ho. |
| **Configuration / Settings page** | Navbar → **Settings**: company details, bank details, default GST%, default terms, aur har invoice type ke liye invoice-number prefix + running counter — sab ek jagah set karo, har naye invoice me apne aap bhar jaayega. |
| **Production hardening** | Helmet, rate limiting, CORS whitelist (env se), gzip compression, centralized error handling, Mongo injection sanitization, request validation, ek hi shared Puppeteer browser instance (fast PDF generation), graceful shutdown, Docker + docker-compose. |
| **Mobile responsive** | Navbar drawer, stacked form fields, horizontally-scrollable tables, fullscreen preview dialog — sab kuch phone par bhi easily use ho sake. |

## Fonts (jaisa specify kiya gaya)

| Font | Kahan use hota hai |
|---|---|
| **Times New Roman** | Company name, "INVOICE" badge, totals box — PDF me |
| **Cambria** | Baaki sara data — PDF me |
| **Calibri** | Frontend form input fields |

## Folder Structure

```
invoice-app/
  backend/
    config/db.js            -> MongoDB connection
    middleware/              -> error handler + request validators
    models/Invoice.js        -> invoice schema (type: customer/dealer)
    models/Config.js         -> singleton config (company/bank/defaults/numbering)
    controllers/             -> invoiceController, configController
    templates/invoiceTemplate.js -> HTML->PDF template (type-aware Bill/Ship To)
    utils/generatePdf.js     -> shared Puppeteer browser instance
    Dockerfile
  frontend/
    app/                     -> New Invoice, Saved Invoices, Settings pages
    components/               -> Navbar, InvoiceForm, ItemsTable, InvoiceList,
                                  PreviewDialog, SettingsForm, PartyFields, ...
    lib/api.js               -> axios client (same-origin /api, no hardcoded URL)
    lib/queryKeys.js         -> react-query cache keys
    public/logo.jpg          -> Samraddhi Mattresses logo (Navbar + PDF default)
    Dockerfile
  docker-compose.yml         -> mongo + backend + frontend, one command
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# .env me apna MONGO_URI, FRONTEND_ORIGIN waghera daal do
npm run dev
```

Backend `http://localhost:5000` par chalega. Pehli baar `npm install` me Puppeteer Chromium download karega, thoda time lagega.

### API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/invoices` | Naya invoice save karo (type: customer/dealer) |
| GET | `/api/invoices?page=&limit=&search=&type=&sort=` | Paginated list |
| GET | `/api/invoices/:id` | Ek invoice ki detail |
| PUT | `/api/invoices/:id` | Invoice update karo |
| DELETE | `/api/invoices/:id` | Invoice delete karo |
| GET | `/api/invoices/:id/pdf` | Saved invoice ka PDF (3 copies) |
| POST | `/api/invoices/preview/pdf` | Bina save kiye PDF preview |
| POST | `/api/invoices/preview/totals` | Sirf totals calculate |
| GET | `/api/config` | Company/bank/default settings |
| PUT | `/api/config` | Settings update karo |
| GET | `/api/config/next-invoice-number?type=` | Suggested next invoice number |

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# BACKEND_URL localhost:5000 hi rehne do agar backend local pe hai
npm run dev
```

Frontend `http://localhost:3000` par chalega.

## Docker (production-style, one command)

```bash
docker compose up --build
```

Ye MongoDB + backend + frontend teeno start kar dega. Frontend: `http://localhost:3000`.

## Kaise Use Kare

1. **Settings** me jaake company/bank details, default GST%, terms aur invoice-number prefix ek baar set kar do.
2. **New Invoice** tab kholo — upar **Customer** ya **Dealer** type chuno, invoice number apne aap suggest ho jaayega (chaho to badal sakte ho).
3. Form bharo — Bill To/Ship To ("Ship To same as Bill To" checkbox), Transport, Items, Tax, Bank, Terms.
4. **Preview** dabao — popup dialog me PDF preview khulega, wahi se print/download bhi kar sakte ho.
5. **Save & Download** dabao — invoice MongoDB me save hoga, numbering counter aage badh jaayega, aur 3-copy PDF apne aap download ho jaayega.
6. **Saved Invoices** tab me search/filter/sort ke saath fast, paginated list milegi.

## Notes

- Production me deploy karte waqt `FRONTEND_ORIGIN` aur `BACKEND_URL` sahi domains pe set karo.
- Puppeteer ke liye server pe Chromium dependencies chahiye — `backend/Dockerfile` already ye sab install karta hai.
- Logo upload na kiya ho to har jagah default Samraddhi Mattresses logo use hota hai (Settings se badal sakte ho).
