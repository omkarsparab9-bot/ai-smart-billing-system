"""
Database connection and schema initialization using Python's native sqlite3.
No external database drivers or compilation tools required.
Compatible with Python 3.15 Windows CPython.
"""
import os
import sqlite3
import hashlib
import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smart_billing.db")

def hash_password(password: str) -> str:
    """Hash password using standard hashlib SHA-256 with salt - no compiler/Rust dependencies."""
    salt = "smart_billing_secure_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initializes SQLite database tables and seeds default data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users table (Admin & Billing Staff)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
        phone TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 2. Store Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS store_settings (
        id INTEGER PRIMARY KEY,
        store_name TEXT NOT NULL,
        tagline TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        gst_tax_number TEXT,
        currency_symbol TEXT DEFAULT '₹',
        default_tax_rate REAL DEFAULT 18.0
    );
    """)

    # 3. Products table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        cost_price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        min_stock_level INTEGER NOT NULL DEFAULT 5,
        tax_rate REAL NOT NULL DEFAULT 18.0,
        supplier TEXT,
        status TEXT NOT NULL DEFAULT 'In Stock',
        created_at TEXT NOT NULL
    );
    """)

    # 4. Customers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        total_purchases REAL DEFAULT 0.0,
        invoice_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # 5. Invoices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        subtotal REAL NOT NULL,
        discount_amount REAL NOT NULL DEFAULT 0.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        grand_total REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Cash',
        payment_status TEXT NOT NULL DEFAULT 'Paid',
        staff_id INTEGER NOT NULL,
        staff_name TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT
    );
    """)

    # 6. Invoice Items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        cost_price REAL NOT NULL,
        tax_rate REAL NOT NULL,
        item_tax REAL NOT NULL,
        item_total REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
    """)

    # 7. Inventory Stock Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        change_type TEXT NOT NULL,
        quantity_change INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reference_id TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    # 8. Activity Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed Default Store Settings
    cursor.execute("SELECT COUNT(*) FROM store_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO store_settings (id, store_name, tagline, phone, email, address, gst_tax_number, currency_symbol, default_tax_rate)
        VALUES (1, 'Apex Retail & Electronics', 'Quality Goods & Reliable Service', '+91 98765 43210', 'support@apexretail.local', 'Shop 14, Commercial Plaza, M.G. Road', '27AABCA1234F1Z8', '₹', 18.0)
        """)
        conn.commit()

    # Seed Users (admin123 and staff123)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
        INSERT INTO users (username, password_hash, full_name, role, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ('admin', hash_password('admin123'), 'Store Manager (Admin)', 'admin', '+91 98765 00001', now))

        cursor.execute("""
        INSERT INTO users (username, password_hash, full_name, role, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ('staff', hash_password('staff123'), 'Rahul Verma (Billing Staff)', 'staff', '+91 98765 00002', now))
        conn.commit()

    # Seed Products
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        initial_products = [
            ("Wireless Ergonomic Mouse", "Electronics", "EL-MS-001", 850.00, 520.00, 35, 8, 18.0, "LogiTech Dist.", "In Stock", now),
            ("Mechanical RGB Keyboard", "Electronics", "EL-KB-002", 2499.00, 1600.00, 18, 5, 18.0, "Redragon Supply", "In Stock", now),
            ("Premium Laptop Backpack", "Accessories", "AC-BP-003", 1450.00, 850.00, 42, 10, 12.0, "Wildcraft India", "In Stock", now),
            ("65W GaN Fast Charger", "Electronics", "EL-CH-004", 1299.00, 750.00, 24, 6, 18.0, "Anker Tech", "In Stock", now),
            ("Braided USB-C Cable (2m)", "Accessories", "AC-CB-005", 299.00, 120.00, 75, 15, 18.0, "Portronics", "In Stock", now),
            ("Noise-Cancelling Headphones", "Audio", "AU-HP-006", 3999.00, 2600.00, 4, 6, 18.0, "Boat Lifestyle", "Low Stock", now),
            ("Desk Writing Pad XL", "Stationery", "ST-DP-007", 599.00, 280.00, 30, 8, 12.0, "DailyOffice Goods", "In Stock", now),
            ("Screen Cleaning Kit", "Accessories", "AC-CK-008", 199.00, 75.00, 50, 10, 12.0, "Apex Goods", "In Stock", now),
            ("Portable SSD 1TB USB 3.2", "Storage", "ST-SD-009", 6800.00, 5100.00, 3, 5, 18.0, "Crucial Tech", "Low Stock", now),
            ("Gel Pen Box (10 Pcs)", "Stationery", "ST-GP-010", 150.00, 80.00, 0, 10, 5.0, "Reynolds India", "Out of Stock", now)
        ]
        cursor.executemany("""
        INSERT INTO products (name, category, sku, price, cost_price, stock_quantity, min_stock_level, tax_rate, supplier, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_products)
        conn.commit()

    # Seed Customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        initial_customers = [
            ("Aarav Sharma", "+91 98201 11223", "aarav.sharma@example.com", "Flat 402, Green Valley Apt, Pune", 4648.0, 2, now),
            ("Pooja Patel", "+91 97123 44556", "pooja.p@example.com", "B-12, Lotus Park, Ahmedabad", 2499.0, 1, now),
            ("Vikram Malhotra", "+91 98800 77889", "vikram.m@example.com", "88 Residency Road, Bengaluru", 8099.0, 2, now),
            ("Sneha Roy", "+91 99032 66778", "sneha.roy@example.com", "Salt Lake Sector 3, Kolkata", 1450.0, 1, now),
            ("Walk-in Customer", "+91 99999 99999", "cash@retail.store", "Direct Counter Sale", 299.0, 1, now)
        ]
        cursor.executemany("""
        INSERT INTO customers (name, phone, email, address, total_purchases, invoice_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, initial_customers)
        conn.commit()

    # Seed Sample Invoices if none exist
    cursor.execute("SELECT COUNT(*) FROM invoices")
    if cursor.fetchone()[0] == 0:
        now = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
        INSERT INTO invoices (invoice_number, customer_id, customer_name, customer_phone, subtotal, discount_amount, tax_amount, grand_total, payment_method, payment_status, staff_id, staff_name, notes, created_at)
        VALUES ('INV-2026-0001', 1, 'Aarav Sharma', '+91 98201 11223', 2149.00, 50.00, 377.82, 2476.82, 'UPI', 'Paid', 2, 'Rahul Verma (Billing Staff)', 'Counter sale with UPI payment', ?)
        """, (now,))
        inv_id = cursor.lastrowid

        cursor.execute("""
        INSERT INTO invoice_items (invoice_id, product_id, product_name, sku, quantity, unit_price, cost_price, tax_rate, item_tax, item_total)
        VALUES (?, 1, 'Wireless Ergonomic Mouse', 'EL-MS-001', 1, 850.00, 520.00, 18.0, 153.00, 1003.00)
        """, (inv_id,))

        cursor.execute("""
        INSERT INTO invoice_items (invoice_id, product_id, product_name, sku, quantity, unit_price, cost_price, tax_rate, item_tax, item_total)
        VALUES (?, 4, '65W GaN Fast Charger', 'EL-CH-004', 1, 1299.00, 750.00, 18.0, 233.82, 1532.82)
        """, (inv_id,))

        # Activity log
        cursor.execute("""
        INSERT INTO activity_logs (user_id, username, action, details, created_at)
        VALUES (2, 'staff', 'Created Invoice', 'Generated invoice INV-2026-0001 for Aarav Sharma amount ₹2,476.82', ?)
        """, (now,))

        conn.commit()

    conn.close()

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Helper to turn a sqlite3.Row into a standard dict."""
    return {k: row[k] for k in row.keys()}

def rows_to_list(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Helper to convert list of rows to dicts."""
    return [row_to_dict(r) for r in rows]
