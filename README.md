# AI Smart Billing and Sales System

A complete, production-ready, full-stack billing and sales management application designed for small businesses and retail shops.

Built as an authentic college mini-project featuring automated invoice generation, real-time stock deduction, inventory threshold tracking, practical sales reporting, and a Google Gemini AI Business Assistant.

---

## 1. System Architecture & Tech Stack

```
React (TypeScript + Vite + Tailwind CSS)
         ↓  HTTP REST API (port 3000 -> 8000)
FastAPI Backend (Python 3.15 Windows CPython compatible)
         ↓
SQLite Database (smart_billing.db)
         ↓
Google Gemini 2.5 Flash API (Context-aware business reasoning)
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons
- **Backend**: Python 3.15, FastAPI, Uvicorn (zero Rust or Visual Studio C++ compiler dependencies)
- **Database**: SQLite (native Python `sqlite3`, automatic schema creation and seeding)
- **AI Engine**: Google Gemini API via official REST endpoint using real-time database context

---

## 2. Project Structure

```
smart-billing-system/
├── backend/
│   ├── app.py               # FastAPI application, routes, and Gemini integration
│   ├── database.py          # SQLite schema, tables, transactions & seed data
│   ├── models.py            # Pydantic models for validation
│   ├── auth.py              # Lightweight token authentication and RBAC
│   ├── requirements.txt     # Python 3.15 Windows-compatible dependencies
│   └── smart_billing.db     # SQLite database (auto-generated on startup)
│
├── src/
│   ├── components/
│   │   ├── Navbar.tsx       # Top status bar & backend connectivity indicator
│   │   ├── Sidebar.tsx      # Main application navigation & user role badges
│   │   └── InvoiceModal.tsx # Printable tax receipt / cash bill modal
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state, login/logout, and connectivity monitor
│   ├── pages/
│   │   ├── Dashboard.tsx    # Practical shop management overview
│   │   ├── BillingPage.tsx  # Core POS terminal, cart, and invoice generator
│   │   ├── InvoicesPage.tsx # Invoice archive, audit records, and re-printing
│   │   ├── ProductsPage.tsx # Product catalog (CRUD, SKU, prices, tax)
│   │   ├── CustomersPage.tsx# Customer directory and purchase history
│   │   ├── InventoryPage.tsx# Stock monitoring, alerts, and restock logs
│   │   ├── SalesPage.tsx    # Sales transaction logs and filters
│   │   ├── ReportsPage.tsx  # Daily, monthly, top products, and payment breakdown
│   │   ├── AIAssistantPage.tsx # Gemini AI assistant with live database data
│   │   ├── StaffPage.tsx    # Staff management & role permissions (Admin only)
│   │   ├── SettingsPage.tsx # Store name, GSTIN, and tax rates (Admin only)
│   │   └── LoginPage.tsx    # Local login with quick role switcher
│   ├── services/
│   │   └── api.ts           # Centralized API client with offline fallback
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Root application router
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind styling & print invoice layout
│
├── .env.example             # Environment variables template
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite server configuration & API proxy
└── README.md                # Project documentation and guide
```

---

## 3. Prerequisites & Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **Python**: Python 3.15 (also works with 3.10, 3.11, 3.12, 3.13, 3.14)
- **Node.js**: v18+ or v20+ with npm
- **Editor**: Visual Studio Code (Standard Python and Pylance extensions)

---

## 4. Backend Setup & Execution

Open a terminal in the project root folder (in VS Code):

### Step 1: Install Python dependencies
```cmd
py -m pip install -r backend\requirements.txt
```

*(Note: dependencies avoid compiled Rust and C++ libraries; prebuilt wheels are compatible with Windows Python 3.15)*

### Step 2: Start the FastAPI Backend
```cmd
py -m uvicorn backend.app:app --reload --port 8000
```

The backend server starts on: **`http://127.0.0.1:8000`**
Interactive API Swagger documentation is available at: **`http://127.0.0.1:8000/docs`**

---

## 5. Frontend Setup & Execution

Open a **second terminal** in Visual Studio Code:

### Step 1: Install Node.js dependencies
```cmd
npm.cmd install --legacy-peer-deps
```

*(On macOS/Linux, simply run `npm install --legacy-peer-deps`)*

### Step 2: Start the React / Vite Frontend
```cmd
npm.cmd run dev
```

*(On macOS/Linux, run `npm run dev`)*

Open your browser and navigate to:
**`http://localhost:3000`**

---

## 6. Environment Variables Setup (Gemini AI)

1. Create a `.env` file in the project root by copying `.env.example`:
```cmd
copy .env.example .env
```
2. Open `.env` and set your Google Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
```
*(If the key is not configured, the AI Assistant automatically falls back to an intelligent local analytics engine using live database context without crashing.)*

---

## 7. Default User Accounts (Local Authentication)

The SQLite database is initialized with two default roles:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Store Administrator** | `admin` | `admin123` | Complete store access: catalog CRUD, stock adjustments, reports, staff management, store settings, and AI assistant |
| **Billing Staff** | `staff` | `staff123` | POS billing terminal, customer search/add, invoice generation, receipt printing, stock view |

---

## 8. How to Test Core Features

### 1. Test Point-of-Sale Billing & Automated Calculations
1. Log in as `admin` or `staff`.
2. Click **New Bill / POS** in the left sidebar.
3. Select an existing customer or click **New Customer** to quickly add one.
4. Search or click on products (e.g. *Mechanical RGB Keyboard* or *Wireless Ergonomic Mouse*).
5. Change quantities using the `+` and `-` buttons. Notice the cart enforces stock limits.
6. Enter an optional discount (Flat ₹ or %). Notice subtotal, tax, and grand total calculate dynamically.
7. Select a payment method (**Cash**, **UPI / QR**, **Card**, or **Bank Transfer**).
8. Click **Generate & Save Invoice**.
9. The professional tax receipt opens instantly in the receipt modal. Click **Print Invoice** to open the browser print dialog.

### 2. Verify Real-Time Inventory Stock Deduction
1. Go to **Inventory** in the sidebar.
2. Note the stock count of any product.
3. Generate a bill containing that product.
4. Return to **Inventory** — verify the stock decreased immediately and an audit log was generated.
5. If stock falls below safety levels, the item is automatically flagged with a **Low Stock Warning**.

### 3. Test Google Gemini AI Assistant
1. Click **AI Assistant** in the sidebar.
2. Click any of the suggested prompt chips or type your own question:
   - *"Which products are selling the most?"*
   - *"Which products need restocking?"*
   - *"Give me a summary of this month's sales."*
   - *"Which customers have purchased the most?"*
3. The AI assistant extracts real context from SQLite and provides concise, data-grounded business suggestions.

### 4. Test Role-Based Authorization
1. Log out and sign in as `staff` (`staff123`).
2. Notice the administrative options (**Staff Management** and **Store Settings**) are hidden.
3. Try performing billing and customer registration — all cashier functions work smoothly.

---

## 9. Academic Mini-Project Viva Q&A Highlights

- **Database Normalization**: Uses 8 distinct relational tables (`users`, `products`, `customers`, `invoices`, `invoice_items`, `inventory_logs`, `activity_logs`, `store_settings`).
- **Data Integrity**: Uses SQLite foreign key constraints (`PRAGMA foreign_keys = ON`) and atomic transactions when generating invoices so inventory decrements and billing records never become desynchronized.
- **Security**: Passwords hashed using standard cryptographic algorithms (`hashlib.sha256` with secure salting). Tokens validated using HMAC signature verification.
- **Portability**: Pure Python implementation runs directly on Windows without requiring Visual C++ Build Tools or Rust toolchains.
