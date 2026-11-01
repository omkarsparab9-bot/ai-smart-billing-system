"""
AI Smart Billing and Sales System - FastAPI Backend
Compatible with Python 3.15 Windows CPython.
Runs standalone with: py -m uvicorn backend.app:app --reload --port 8000
"""
import os
import json
import sqlite3
import datetime
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file
load_dotenv()

from backend.database import (
    init_db,
    get_db_connection,
    hash_password,
    row_to_dict,
    rows_to_list,
    DB_PATH
)
from backend.models import (
    LoginRequest,
    UserCreate,
    ProductCreate,
    ProductUpdate,
    CustomerCreate,
    CustomerUpdate,
    InvoiceCreate,
    InventoryAdjustment,
    AIChatRequest,
    StoreSettingsUpdate
)
from backend.auth import (
    create_access_token,
    get_current_user,
    require_admin
)

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="AI Smart Billing and Sales System API",
    description="Backend API for small retail billing, sales tracking, and inventory management.",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and web preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# SYSTEM & HEALTH
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "AI Smart Billing and Sales System",
        "database": "SQLite",
        "database_file": DB_PATH,
        "timestamp": datetime.datetime.now().isoformat()
    }

# -------------------------------------------------------------
# AUTHENTICATION & USERS
# -------------------------------------------------------------
@app.post("/api/auth/login")
def login(creds: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(creds.password)
    
    cursor.execute("""
    SELECT id, username, full_name, role, phone, created_at 
    FROM users 
    WHERE username = ? AND password_hash = ?
    """, (creds.username, pwd_hash))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. (Default: admin / admin123 or staff / staff123)"
        )

    user = row_to_dict(user_row)
    token = create_access_token(user["id"], user["username"], user["role"], user["full_name"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me")
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@app.get("/api/users")
def list_users(admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, role, phone, created_at FROM users ORDER BY id ASC")
    users = rows_to_list(cursor.fetchall())
    conn.close()
    return users

@app.post("/api/users")
def create_user(user_in: UserCreate, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check duplicate
    cursor.execute("SELECT id FROM users WHERE username = ?", (user_in.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    pwd_hash = hash_password(user_in.password)
    
    cursor.execute("""
    INSERT INTO users (username, password_hash, full_name, role, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (user_in.username, pwd_hash, user_in.full_name, user_in.role, user_in.phone or "", now))
    new_id = cursor.lastrowid
    
    # Audit log
    cursor.execute("""
    INSERT INTO activity_logs (user_id, username, action, details, created_at)
    VALUES (?, ?, 'User Created', ?, ?)
    """, (admin["id"], admin["username"], f"Created user {user_in.username} ({user_in.role})", now))
    
    conn.commit()
    conn.close()
    return {"message": "User created successfully", "user_id": new_id}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, admin: Dict[str, Any] = Depends(require_admin)):
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active administrator account")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, role FROM users WHERE id = ?", (user_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO activity_logs (user_id, username, action, details, created_at)
    VALUES (?, ?, 'User Deleted', ?, ?)
    """, (admin["id"], admin["username"], f"Deleted user account: {target['username']}", now))
    conn.commit()
    conn.close()
    return {"message": f"User {target['username']} deleted successfully"}

# -------------------------------------------------------------
# STORE SETTINGS
# -------------------------------------------------------------
@app.get("/api/settings")
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM store_settings WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "store_name": "Apex Retail & Electronics",
            "tagline": "Quality Goods & Reliable Service",
            "phone": "+91 98765 43210",
            "email": "support@apexretail.local",
            "address": "Shop 14, Commercial Plaza, M.G. Road",
            "gst_tax_number": "27AABCA1234F1Z8",
            "currency_symbol": "₹",
            "default_tax_rate": 18.0
        }
    return row_to_dict(row)

@app.put("/api/settings")
def update_settings(settings: StoreSettingsUpdate, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE store_settings
    SET store_name = ?, tagline = ?, phone = ?, email = ?, address = ?, gst_tax_number = ?, currency_symbol = ?, default_tax_rate = ?
    WHERE id = 1
    """, (settings.store_name, settings.tagline, settings.phone, settings.email, settings.address, settings.gst_tax_number, settings.currency_symbol, settings.default_tax_rate))
    conn.commit()
    conn.close()
    return {"message": "Store settings updated successfully"}

# -------------------------------------------------------------
# PRODUCTS MANAGEMENT
# -------------------------------------------------------------
@app.get("/api/products")
def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if search:
        query += " AND (name LIKE ? OR sku LIKE ? OR supplier LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
        
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
        
    if status and status != "All":
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY name ASC"
    cursor.execute(query, params)
    products = rows_to_list(cursor.fetchall())
    conn.close()
    return products

@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return row_to_dict(row)

@app.post("/api/products")
def create_product(product: ProductCreate, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check duplicate SKU
    cursor.execute("SELECT id FROM products WHERE sku = ?", (product.sku,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product.sku}' already exists.")
        
    # Determine stock status
    prod_status = "In Stock"
    if product.stock_quantity == 0:
        prod_status = "Out of Stock"
    elif product.stock_quantity <= product.min_stock_level:
        prod_status = "Low Stock"
        
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO products (name, category, sku, price, cost_price, stock_quantity, min_stock_level, tax_rate, supplier, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (product.name, product.category, product.sku, product.price, product.cost_price, product.stock_quantity, product.min_stock_level, product.tax_rate, product.supplier or "", prod_status, now))
    new_id = cursor.lastrowid
    
    # Log initial inventory
    cursor.execute("""
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_id, notes, created_at)
    VALUES (?, 'Initial Stock', ?, 0, ?, 'NEW_ITEM', 'Initial product catalog entry', ?)
    """, (new_id, product.stock_quantity, product.stock_quantity, now))
    
    conn.commit()
    conn.close()
    return {"message": "Product created successfully", "product_id": new_id}

@app.put("/api/products/{product_id}")
def update_product(product_id: int, update: ProductUpdate, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
        
    current = dict(existing)
    
    # Update fields
    name = update.name if update.name is not None else current["name"]
    category = update.category if update.category is not None else current["category"]
    sku = update.sku if update.sku is not None else current["sku"]
    price = update.price if update.price is not None else current["price"]
    cost_price = update.cost_price if update.cost_price is not None else current["cost_price"]
    stock_qty = update.stock_quantity if update.stock_quantity is not None else current["stock_quantity"]
    min_stock = update.min_stock_level if update.min_stock_level is not None else current["min_stock_level"]
    tax_rate = update.tax_rate if update.tax_rate is not None else current["tax_rate"]
    supplier = update.supplier if update.supplier is not None else current["supplier"]
    
    # Recalculate status based on new stock
    if stock_qty == 0:
        new_status = "Out of Stock"
    elif stock_qty <= min_stock:
        new_status = "Low Stock"
    else:
        new_status = "In Stock"
        
    cursor.execute("""
    UPDATE products
    SET name = ?, category = ?, sku = ?, price = ?, cost_price = ?, stock_quantity = ?, min_stock_level = ?, tax_rate = ?, supplier = ?, status = ?
    WHERE id = ?
    """, (name, category, sku, price, cost_price, stock_qty, min_stock, tax_rate, supplier, new_status, product_id))
    
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # If stock changed, log audit
    if update.stock_quantity is not None and update.stock_quantity != current["stock_quantity"]:
        diff = update.stock_quantity - current["stock_quantity"]
        cursor.execute("""
        INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_id, notes, created_at)
        VALUES (?, 'Manual Edit', ?, ?, ?, 'PRODUCT_UPDATE', 'Product details edited by admin', ?)
        """, (product_id, diff, current["stock_quantity"], update.stock_quantity, now))

    conn.commit()
    conn.close()
    return {"message": "Product updated successfully"}

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if product is in any invoice
    cursor.execute("SELECT COUNT(*) FROM invoice_items WHERE product_id = ?", (product_id,))
    if cursor.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete product as it is referenced in past invoices. You can set its stock to 0 instead.")
        
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"message": "Product deleted successfully"}

# -------------------------------------------------------------
# CUSTOMERS MANAGEMENT
# -------------------------------------------------------------
@app.get("/api/customers")
def list_customers(search: Optional[str] = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM customers WHERE 1=1"
    params = []
    if search:
        query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    query += " ORDER BY name ASC"
    cursor.execute(query, params)
    customers = rows_to_list(cursor.fetchall())
    conn.close()
    return customers

@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    customer_row = cursor.fetchone()
    if not customer_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")
        
    customer = row_to_dict(customer_row)
    
    # Invoices for this customer
    cursor.execute("""
    SELECT id, invoice_number, subtotal, discount_amount, tax_amount, grand_total, payment_method, payment_status, created_at
    FROM invoices
    WHERE customer_id = ?
    ORDER BY id DESC
    """, (customer_id,))
    customer["invoices"] = rows_to_list(cursor.fetchall())
    conn.close()
    return customer

@app.post("/api/customers")
def create_customer(c: CustomerCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO customers (name, phone, email, address, total_purchases, invoice_count, created_at)
    VALUES (?, ?, ?, ?, 0.0, 0, ?)
    """, (c.name, c.phone, c.email or "", c.address or "", now))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Customer created successfully", "customer_id": new_id, "name": c.name, "phone": c.phone}

@app.put("/api/customers/{customer_id}")
def update_customer(customer_id: int, c: CustomerUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Customer not found")
        
    curr = dict(row)
    name = c.name if c.name is not None else curr["name"]
    phone = c.phone if c.phone is not None else curr["phone"]
    email = c.email if c.email is not None else curr["email"]
    address = c.address if c.address is not None else curr["address"]
    
    cursor.execute("""
    UPDATE customers
    SET name = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
    """, (name, phone, email, address, customer_id))
    conn.commit()
    conn.close()
    return {"message": "Customer updated successfully"}

# -------------------------------------------------------------
# BILLING & INVOICES (CORE BUSINESS ENGINE)
# -------------------------------------------------------------
@app.post("/api/invoices")
def create_invoice(invoice_in: InvoiceCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Creates bill, validates stock, reduces product inventory atomically,
    records transaction, logs audit and returns complete invoice receipt.
    """
    if not invoice_in.items:
        raise HTTPException(status_code=400, detail="Invoice must contain at least one product item.")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Validate all items and current stock availability
        calculated_subtotal = 0.0
        calculated_tax_total = 0.0
        item_records = []

        for item in invoice_in.items:
            cursor.execute("SELECT id, name, sku, price, cost_price, stock_quantity, min_stock_level, tax_rate FROM products WHERE id = ?", (item.product_id,))
            prod = cursor.fetchone()
            if not prod:
                raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")

            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity {item.quantity} for {prod['name']}.")

            if prod["stock_quantity"] < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{prod['name']}'. Requested: {item.quantity}, Available: {prod['stock_quantity']}."
                )

            unit_price = item.unit_price if item.unit_price > 0 else prod["price"]
            tax_rate = item.tax_rate if item.tax_rate is not None else prod["tax_rate"]
            
            item_base_price = unit_price * item.quantity
            item_tax = round((item_base_price * (tax_rate / 100.0)), 2)
            item_total = round(item_base_price + item_tax, 2)

            calculated_subtotal += item_base_price
            calculated_tax_total += item_tax

            item_records.append({
                "product_id": prod["id"],
                "product_name": prod["name"],
                "sku": prod["sku"],
                "quantity": item.quantity,
                "unit_price": unit_price,
                "cost_price": prod["cost_price"],
                "tax_rate": tax_rate,
                "item_tax": item_tax,
                "item_total": item_total,
                "prev_stock": prod["stock_quantity"],
                "min_stock": prod["min_stock_level"]
            })

        calculated_subtotal = round(calculated_subtotal, 2)
        calculated_tax_total = round(calculated_tax_total, 2)
        discount = round(invoice_in.discount_amount, 2)
        grand_total = round(max(0.0, (calculated_subtotal - discount) + calculated_tax_total), 2)

        # 2. Generate unique invoice number: INV-YEAR-0001
        year = datetime.datetime.now().year
        cursor.execute("SELECT COUNT(*) FROM invoices")
        count = cursor.fetchone()[0] + 1
        invoice_number = f"INV-{year}-{count:04d}"

        # Ensure uniqueness
        while True:
            cursor.execute("SELECT id FROM invoices WHERE invoice_number = ?", (invoice_number,))
            if not cursor.fetchone():
                break
            count += 1
            invoice_number = f"INV-{year}-{count:04d}"

        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 3. Handle Customer Association
        cust_id = invoice_in.customer_id
        if not cust_id and invoice_in.customer_name.strip():
            # Check existing customer by phone or create
            phone = invoice_in.customer_phone or ""
            if phone:
                cursor.execute("SELECT id FROM customers WHERE phone = ?", (phone,))
                existing_c = cursor.fetchone()
                if existing_c:
                    cust_id = existing_c["id"]
            if not cust_id:
                cursor.execute("""
                INSERT INTO customers (name, phone, email, address, total_purchases, invoice_count, created_at)
                VALUES (?, ?, '', '', 0, 0, ?)
                """, (invoice_in.customer_name, invoice_in.customer_phone or "", now))
                cust_id = cursor.lastrowid

        # 4. Insert Invoice record
        cursor.execute("""
        INSERT INTO invoices (
            invoice_number, customer_id, customer_name, customer_phone,
            subtotal, discount_amount, tax_amount, grand_total,
            payment_method, payment_status, staff_id, staff_name, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice_number,
            cust_id,
            invoice_in.customer_name,
            invoice_in.customer_phone or "",
            calculated_subtotal,
            discount,
            calculated_tax_total,
            grand_total,
            invoice_in.payment_method,
            invoice_in.payment_status,
            current_user["id"],
            current_user["full_name"],
            invoice_in.notes or "",
            now
        ))
        invoice_id = cursor.lastrowid

        # 5. Insert Invoice Items & Update Inventory Atomically
        for itm in item_records:
            cursor.execute("""
            INSERT INTO invoice_items (
                invoice_id, product_id, product_name, sku, quantity,
                unit_price, cost_price, tax_rate, item_tax, item_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                invoice_id,
                itm["product_id"],
                itm["product_name"],
                itm["sku"],
                itm["quantity"],
                itm["unit_price"],
                itm["cost_price"],
                itm["tax_rate"],
                itm["item_tax"],
                itm["item_total"]
            ))

            new_stock = itm["prev_stock"] - itm["quantity"]
            if new_stock == 0:
                new_status = "Out of Stock"
            elif new_stock <= itm["min_stock"]:
                new_status = "Low Stock"
            else:
                new_status = "In Stock"

            cursor.execute("""
            UPDATE products
            SET stock_quantity = ?, status = ?
            WHERE id = ?
            """, (new_stock, new_status, itm["product_id"]))

            # Inventory audit log
            cursor.execute("""
            INSERT INTO inventory_logs (
                product_id, change_type, quantity_change, previous_stock, new_stock, reference_id, notes, created_at
            ) VALUES (?, 'Sale', ?, ?, ?, ?, ?, ?)
            """, (
                itm["product_id"],
                -itm["quantity"],
                itm["prev_stock"],
                new_stock,
                invoice_number,
                f"Billed to {invoice_in.customer_name}",
                now
            ))

        # 6. Update Customer Statistics
        if cust_id:
            cursor.execute("""
            UPDATE customers
            SET total_purchases = total_purchases + ?,
                invoice_count = invoice_count + 1
            WHERE id = ?
            """, (grand_total, cust_id))

        # 7. Activity Log
        cursor.execute("""
        INSERT INTO activity_logs (user_id, username, action, details, created_at)
        VALUES (?, ?, 'Generate Invoice', ?, ?)
        """, (
            current_user["id"],
            current_user["username"],
            f"Created {invoice_number} ({len(item_records)} items) for {invoice_in.customer_name} total: ₹{grand_total:,.2f}",
            now
        ))

        conn.commit()

        # Retrieve newly generated invoice for return
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        created_invoice = row_to_dict(cursor.fetchone())
        created_invoice["items"] = item_records

        conn.close()
        return created_invoice

    except Exception as e:
        conn.rollback()
        conn.close()
        raise e

@app.get("/api/invoices")
def list_invoices(
    search: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    staff_id: Optional[int] = Query(None),
    limit: int = 100
):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM invoices WHERE 1=1"
    params = []

    if search:
        query += " AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])

    if payment_status and payment_status != "All":
        query += " AND payment_status = ?"
        params.append(payment_status)

    if staff_id:
        query += " AND staff_id = ?"
        params.append(staff_id)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    invoices = rows_to_list(cursor.fetchall())
    conn.close()
    return invoices

@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv = cursor.fetchone()
    if not inv:
        conn.close()
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_data = row_to_dict(inv)
    
    # Fetch invoice items
    cursor.execute("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC", (invoice_id,))
    invoice_data["items"] = rows_to_list(cursor.fetchall())

    # Fetch store settings for receipt layout
    cursor.execute("SELECT * FROM store_settings WHERE id = 1")
    store = cursor.fetchone()
    if store:
        invoice_data["store"] = row_to_dict(store)

    conn.close()
    return invoice_data

# -------------------------------------------------------------
# INVENTORY MANAGEMENT
# -------------------------------------------------------------
@app.get("/api/inventory")
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM products WHERE status = 'In Stock'")
    in_stock_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM products WHERE status = 'Low Stock'")
    low_stock_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM products WHERE status = 'Out of Stock'")
    out_of_stock_count = cursor.fetchone()[0]

    # Fetch items requiring attention
    cursor.execute("""
    SELECT id, name, category, sku, price, stock_quantity, min_stock_level, status, supplier
    FROM products
    WHERE stock_quantity <= min_stock_level
    ORDER BY stock_quantity ASC
    """)
    attention_items = rows_to_list(cursor.fetchall())

    conn.close()
    return {
        "summary": {
            "total_products": total_products,
            "in_stock": in_stock_count,
            "low_stock": low_stock_count,
            "out_of_stock": out_of_stock_count
        },
        "attention_items": attention_items
    }

@app.post("/api/inventory/adjust")
def adjust_inventory(adj: InventoryAdjustment, admin: Dict[str, Any] = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, stock_quantity, min_stock_level FROM products WHERE id = ?", (adj.product_id,))
    prod = cursor.fetchone()
    if not prod:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    prev_stock = prod["stock_quantity"]
    new_stock = prev_stock + adj.quantity_change
    if new_stock < 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot reduce stock below zero")

    if new_stock == 0:
        new_status = "Out of Stock"
    elif new_stock <= prod["min_stock_level"]:
        new_status = "Low Stock"
    else:
        new_status = "In Stock"

    cursor.execute("""
    UPDATE products SET stock_quantity = ?, status = ? WHERE id = ?
    """, (new_stock, new_status, adj.product_id))

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    change_type = "Restock" if adj.quantity_change > 0 else "Stock Reduction"
    cursor.execute("""
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_stock, new_stock, reference_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, 'MANUAL_ADJUST', ?, ?)
    """, (adj.product_id, change_type, adj.quantity_change, prev_stock, new_stock, adj.reason, now))

    conn.commit()
    conn.close()
    return {"message": "Stock adjusted successfully", "new_stock": new_stock, "status": new_status}

@app.get("/api/inventory/logs")
def get_inventory_logs(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT l.*, p.name as product_name, p.sku
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    ORDER BY l.id DESC LIMIT ?
    """, (limit,))
    logs = rows_to_list(cursor.fetchall())
    conn.close()
    return logs

# -------------------------------------------------------------
# SALES TRANSACTIONS
# -------------------------------------------------------------
@app.get("/api/sales")
def get_sales(
    date_filter: Optional[str] = Query(None), # today, week, month, all
    payment_status: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM invoices WHERE 1=1"
    params = []

    today_str = datetime.date.today().strftime("%Y-%m-%d")

    if date_filter == "today":
        query += " AND created_at LIKE ?"
        params.append(f"{today_str}%")
    elif date_filter == "week":
        week_ago = (datetime.date.today() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        query += " AND created_at >= ?"
        params.append(f"{week_ago} 00:00:00")
    elif date_filter == "month":
        month_ago = (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
        query += " AND created_at >= ?"
        params.append(f"{month_ago} 00:00:00")

    if payment_status and payment_status != "All":
        query += " AND payment_status = ?"
        params.append(payment_status)

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    sales = rows_to_list(cursor.fetchall())
    conn.close()
    return sales

# -------------------------------------------------------------
# PRACTICAL BUSINESS REPORTS
# -------------------------------------------------------------
@app.get("/api/reports/summary")
def get_reports_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    month_str = datetime.date.today().strftime("%Y-%m")

    # Today's Sales
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices WHERE created_at LIKE ?", (f"{today_str}%",))
    today_total, today_count = cursor.fetchone()

    # This Month's Sales
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices WHERE created_at LIKE ?", (f"{month_str}%",))
    month_total, month_count = cursor.fetchone()

    # Total Overall Revenue
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices")
    all_time_total, all_time_count = cursor.fetchone()

    # Top Selling Products (by quantity)
    cursor.execute("""
    SELECT product_name, sku, SUM(quantity) as total_units_sold, SUM(item_total) as total_revenue
    FROM invoice_items
    GROUP BY product_id
    ORDER BY total_units_sold DESC
    LIMIT 5
    """)
    top_products = rows_to_list(cursor.fetchall())

    # Payment Methods Breakdown
    cursor.execute("""
    SELECT payment_method, COUNT(*) as invoice_count, SUM(grand_total) as total_amount
    FROM invoices
    GROUP BY payment_method
    """)
    payment_methods = rows_to_list(cursor.fetchall())

    # Low Stock Products count
    cursor.execute("SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level")
    low_stock_items_count = cursor.fetchone()[0]

    # Daily sales for the last 7 days
    daily_sales = []
    for i in range(6, -1, -1):
        day = (datetime.date.today() - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices WHERE created_at LIKE ?", (f"{day}%",))
        d_rev, d_cnt = cursor.fetchone()
        daily_sales.append({
            "date": day,
            "day_name": (datetime.date.today() - datetime.timedelta(days=i)).strftime("%a"),
            "revenue": round(d_rev, 2),
            "invoices": d_cnt
        })

    # Recent 5 invoices
    cursor.execute("SELECT id, invoice_number, customer_name, grand_total, payment_status, payment_method, created_at FROM invoices ORDER BY id DESC LIMIT 5")
    recent_invoices = rows_to_list(cursor.fetchall())

    conn.close()
    return {
        "today": {"revenue": round(today_total, 2), "invoices": today_count},
        "month": {"revenue": round(month_total, 2), "invoices": month_count},
        "all_time": {"revenue": round(all_time_total, 2), "invoices": all_time_count},
        "low_stock_count": low_stock_items_count,
        "top_selling_products": top_products,
        "payment_breakdown": payment_methods,
        "daily_trends": daily_sales,
        "recent_invoices": recent_invoices
    }

# -------------------------------------------------------------
# GOOGLE GEMINI AI BUSINESS ASSISTANT
# -------------------------------------------------------------
@app.post("/api/ai/chat")
def ai_business_assistant(request: AIChatRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches real SQLite shop data, formats concise business context,
    and asks Google Gemini API for actionable shopkeeper insights.
    If GEMINI_API_KEY is not set or fails, returns helpful setup message
    and an intelligent local rule-based answer computed from live data.
    """
    user_query = request.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    # 1. Fetch live shop context from SQLite
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total products & stock states
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]

    cursor.execute("SELECT name, sku, stock_quantity, min_stock_level FROM products WHERE stock_quantity <= min_stock_level")
    low_stock_rows = rows_to_list(cursor.fetchall())

    # Top selling items
    cursor.execute("""
    SELECT product_name, sku, SUM(quantity) as units_sold, SUM(item_total) as revenue
    FROM invoice_items
    GROUP BY product_id
    ORDER BY units_sold DESC LIMIT 5
    """)
    top_items = rows_to_list(cursor.fetchall())

    # Total sales & recent stats
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices WHERE created_at LIKE ?", (f"{today_str}%",))
    today_rev, today_count = cursor.fetchone()

    cursor.execute("SELECT COALESCE(SUM(grand_total), 0), COUNT(*) FROM invoices")
    total_rev, total_count = cursor.fetchone()

    # Top customers
    cursor.execute("SELECT name, phone, total_purchases, invoice_count FROM customers ORDER BY total_purchases DESC LIMIT 5")
    top_customers = rows_to_list(cursor.fetchall())

    conn.close()

    # 2. Check GEMINI_API_KEY
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Format live context for AI
    context_data = {
        "today_revenue": f"₹{today_rev:,.2f} ({today_count} invoices)",
        "total_revenue": f"₹{total_rev:,.2f} ({total_count} invoices)",
        "total_catalog_products": total_products,
        "critical_low_stock_items": [
            f"{i['name']} (SKU: {i['sku']}, Stock: {i['stock_quantity']}, Min Threshold: {i['min_stock_level']})"
            for i in low_stock_rows
        ],
        "top_selling_products": [
            f"{t['product_name']} ({t['units_sold']} units sold, revenue ₹{t['revenue']:,.2f})"
            for t in top_items
        ],
        "top_customers": [
            f"{c['name']} (₹{c['total_purchases']:,.2f} over {c['invoice_count']} bills)"
            for c in top_customers
        ]
    }

    # If GEMINI_API_KEY is missing, provide informative local response
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key == "your_api_key_here":
        # Formulate rule-based contextual answer
        q_lower = user_query.lower()
        if "restock" in q_lower or "low stock" in q_lower or "inventory" in q_lower:
            if low_stock_rows:
                items_str = ", ".join([f"**{i['name']}** (Current stock: {i['stock_quantity']}, Min: {i['min_stock_level']})" for i in low_stock_rows])
                answer = f"### Low Stock & Restock Alert\nBased on your live store inventory, the following {len(low_stock_rows)} items urgently require restocking:\n- {items_str}\n\n*Recommendation*: Create purchase orders with suppliers immediately to avoid missed sales."
            else:
                answer = "All products currently maintain healthy inventory levels above their minimum stock thresholds."
        elif "selling" in q_lower or "popular" in q_lower or "top product" in q_lower:
            if top_items:
                top_str = "\n".join([f"{idx+1}. **{t['product_name']}** — {t['units_sold']} units sold (Revenue: ₹{t['revenue']:,.2f})" for idx, t in enumerate(top_items)])
                answer = f"### Top Selling Products\nAccording to recorded billing transactions, your highest-performing products are:\n\n{top_str}"
            else:
                answer = "No sales items recorded yet. Create bills to start tracking top-selling products."
        elif "customer" in q_lower or "client" in q_lower or "buyer" in q_lower:
            if top_customers:
                cust_str = "\n".join([f"{idx+1}. **{c['name']}** — Total: ₹{c['total_purchases']:,.2f} ({c['invoice_count']} invoices)" for idx, c in enumerate(top_customers)])
                answer = f"### Top Customers by Purchase Value\nHere are your most valuable customer accounts:\n\n{cust_str}"
            else:
                answer = "No customer purchase records available yet."
        elif "today" in q_lower or "month" in q_lower or "summary" in q_lower or "sales" in q_lower:
            answer = f"### Sales Summary\n- **Today's Revenue:** ₹{today_rev:,.2f} ({today_count} bills)\n- **All-Time Revenue:** ₹{total_rev:,.2f} across {total_count} invoices\n- **Catalog Items:** {total_products} products\n- **Items Needing Restock:** {len(low_stock_rows)} items"
        else:
            answer = f"### AI Business Overview\nHere is your current store status from SQLite:\n- **Today's Sales:** ₹{today_rev:,.2f} ({today_count} invoices)\n- **All-Time Revenue:** ₹{total_rev:,.2f}\n- **Low Stock Alerts:** {len(low_stock_rows)} products\n- **Top Item:** {top_items[0]['product_name'] if top_items else 'N/A'}\n\n*(Note: To enable full natural-language conversational reasoning via Google Gemini, add your `GEMINI_API_KEY` into `.env`)*"

        return {
            "reply": answer,
            "mode": "live_data_local_engine",
            "api_key_configured": False,
            "note": "To enable Gemini Cloud Generative AI, set GEMINI_API_KEY in .env"
        }

    # 3. Call Google Gemini 2.5 Flash API with live context
    system_instruction = (
        "You are the AI Business Assistant for 'Apex Retail & Electronics', an intelligent shop billing and sales system. "
        "You have direct access to live SQLite business data. Provide concise, professional, actionable business answers "
        "tailored for the store manager. Always use the real currency and numbers provided in the context. "
        "Do not invent facts outside the database data provided.\n\n"
        f"LIVE DATABASE CONTEXT:\n{json.dumps(context_data, indent=2)}"
    )

    prompt_body = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Question: {user_query}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 800
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(prompt_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode("utf-8")
            result = json.loads(resp_body)
            candidates = result.get("candidates", [])
            if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                gemini_text = "".join([p.get("text", "") for p in candidates[0]["content"]["parts"]])
                return {
                    "reply": gemini_text,
                    "mode": "gemini_2.5_flash",
                    "api_key_configured": True
                }
            else:
                return {
                    "reply": "Received an unexpected response format from Gemini.",
                    "mode": "fallback",
                    "api_key_configured": True
                }
    except Exception as e:
        # Fallback to local rule-based response if network or key issue occurs
        return {
            "reply": f"Could not reach Gemini API ({str(e)}). Here is your store summary from SQLite:\n- Today: ₹{today_rev:,.2f} ({today_count} bills)\n- Low Stock: {len(low_stock_rows)} items\n- Total Revenue: ₹{total_rev:,.2f}",
            "mode": "error_fallback",
            "api_key_configured": True,
            "error_detail": str(e)
        }
