import { Product, Customer, Invoice, InvoiceItem, StoreSettings, User, ReportSummary, InventoryLog } from '../types';

const API_BASE = 'https://ai-smart-billing-system-etyq.onrender.com';

class ApiService {
  private token: string | null = null;
  private backendAvailable: boolean = false;
  private hasCheckedHealth: boolean = false;

  constructor() {
    this.token = localStorage.getItem('smart_billing_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('smart_billing_token', token);
    } else {
      localStorage.removeItem('smart_billing_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('smart_billing_token');
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        this.backendAvailable = true;
        this.hasCheckedHealth = true;
        return true;
      }
    } catch {
      // Backend not running on port 8000
    }
    this.backendAvailable = false;
    this.hasCheckedHealth = true;
    return false;
  }

  isBackendConnected(): boolean {
    return this.backendAvailable;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errData.detail || `Request failed with status ${res.status}`);
      }

      this.backendAvailable = true;
      return await res.json();
    } catch (err: any) {
      // If network failure (FastAPI not started or offline in preview container), fallback to local storage database
      if (err instanceof TypeError && err.message.includes('fetch')) {
        this.backendAvailable = false;
        return this.localFallback<T>(endpoint, options);
      }
      // If it was an explicit HTTP error from backend, rethrow
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      return this.localFallback<T>(endpoint, options);
    }
  }

  // -------------------------------------------------------------
  // LOCAL IN-BROWSER ENGINE FOR AI STUDIO PREVIEW & OFFLINE DEMO
  // -------------------------------------------------------------
  private initLocalDb() {
    if (!localStorage.getItem('sb_initialized')) {
      const initialProducts: Product[] = [
        { id: 1, name: "Wireless Ergonomic Mouse", category: "Electronics", sku: "EL-MS-001", price: 850.00, cost_price: 520.00, stock_quantity: 35, min_stock_level: 8, tax_rate: 18.0, supplier: "LogiTech Dist.", status: "In Stock" },
        { id: 2, name: "Mechanical RGB Keyboard", category: "Electronics", sku: "EL-KB-002", price: 2499.00, cost_price: 1600.00, stock_quantity: 18, min_stock_level: 5, tax_rate: 18.0, supplier: "Redragon Supply", status: "In Stock" },
        { id: 3, name: "Premium Laptop Backpack", category: "Accessories", sku: "AC-BP-003", price: 1450.00, cost_price: 850.00, stock_quantity: 42, min_stock_level: 10, tax_rate: 12.0, supplier: "Wildcraft India", status: "In Stock" },
        { id: 4, name: "65W GaN Fast Charger", category: "Electronics", sku: "EL-CH-004", price: 1299.00, cost_price: 750.00, stock_quantity: 24, min_stock_level: 6, tax_rate: 18.0, supplier: "Anker Tech", status: "In Stock" },
        { id: 5, name: "Braided USB-C Cable (2m)", category: "Accessories", sku: "AC-CB-005", price: 299.00, cost_price: 120.00, stock_quantity: 75, min_stock_level: 15, tax_rate: 18.0, supplier: "Portronics", status: "In Stock" },
        { id: 6, name: "Noise-Cancelling Headphones", category: "Audio", sku: "AU-HP-006", price: 3999.00, cost_price: 2600.00, stock_quantity: 4, min_stock_level: 6, tax_rate: 18.0, supplier: "Boat Lifestyle", status: "Low Stock" },
        { id: 7, name: "Desk Writing Pad XL", category: "Stationery", sku: "ST-DP-007", price: 599.00, cost_price: 280.00, stock_quantity: 30, min_stock_level: 8, tax_rate: 12.0, supplier: "DailyOffice Goods", status: "In Stock" },
        { id: 8, name: "Screen Cleaning Kit", category: "Accessories", sku: "AC-CK-008", price: 199.00, cost_price: 75.00, stock_quantity: 50, min_stock_level: 10, tax_rate: 12.0, supplier: "Apex Goods", status: "In Stock" },
        { id: 9, name: "Portable SSD 1TB USB 3.2", category: "Storage", sku: "ST-SD-009", price: 6800.00, cost_price: 5100.00, stock_quantity: 3, min_stock_level: 5, tax_rate: 18.0, supplier: "Crucial Tech", status: "Low Stock" },
        { id: 10, name: "Gel Pen Box (10 Pcs)", category: "Stationery", sku: "ST-GP-010", price: 150.00, cost_price: 80.00, stock_quantity: 0, min_stock_level: 10, tax_rate: 5.0, supplier: "Reynolds India", status: "Out of Stock" }
      ];

      const initialCustomers: Customer[] = [
        { id: 1, name: "Aarav Sharma", phone: "+91 98201 11223", email: "aarav.sharma@example.com", address: "Flat 402, Green Valley Apt, Pune", total_purchases: 2476.82, invoice_count: 1 },
        { id: 2, name: "Pooja Patel", phone: "+91 97123 44556", email: "pooja.p@example.com", address: "B-12, Lotus Park, Ahmedabad", total_purchases: 0.0, invoice_count: 0 },
        { id: 3, name: "Vikram Malhotra", phone: "+91 98800 77889", email: "vikram.m@example.com", address: "88 Residency Road, Bengaluru", total_purchases: 0.0, invoice_count: 0 },
        { id: 4, name: "Sneha Roy", phone: "+91 99032 66778", email: "sneha.roy@example.com", address: "Salt Lake Sector 3, Kolkata", total_purchases: 0.0, invoice_count: 0 },
        { id: 5, name: "Walk-in Customer", phone: "+91 99999 99999", email: "cash@retail.store", address: "Direct Counter Sale", total_purchases: 0.0, invoice_count: 0 }
      ];

      const initialSettings: StoreSettings = {
        store_name: "Apex Retail & Electronics",
        tagline: "Quality Goods & Reliable Service",
        phone: "+91 98765 43210",
        email: "support@apexretail.local",
        address: "Shop 14, Commercial Plaza, M.G. Road",
        gst_tax_number: "27AABCA1234F1Z8",
        currency_symbol: "₹",
        default_tax_rate: 18.0
      };

      const initialInvoices: Invoice[] = [
        {
          id: 1,
          invoice_number: "INV-2026-0001",
          customer_id: 1,
          customer_name: "Aarav Sharma",
          customer_phone: "+91 98201 11223",
          subtotal: 2149.00,
          discount_amount: 50.00,
          tax_amount: 377.82,
          grand_total: 2476.82,
          payment_method: "UPI",
          payment_status: "Paid",
          staff_id: 2,
          staff_name: "Rahul Verma (Billing Staff)",
          notes: "Counter sale with UPI payment",
          created_at: new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substring(0, 19),
          items: [
            { product_id: 1, product_name: "Wireless Ergonomic Mouse", sku: "EL-MS-001", quantity: 1, unit_price: 850.00, tax_rate: 18.0, item_tax: 153.00, item_total: 1003.00 },
            { product_id: 4, product_name: "65W GaN Fast Charger", sku: "EL-CH-004", quantity: 1, unit_price: 1299.00, tax_rate: 18.0, item_tax: 233.82, item_total: 1532.82 }
          ]
        }
      ];

      const initialUsers: User[] = [
        { id: 1, username: "admin", full_name: "Store Manager (Admin)", role: "admin", phone: "+91 98765 00001", created_at: "2026-01-01 10:00:00" },
        { id: 2, username: "staff", full_name: "Rahul Verma (Billing Staff)", role: "staff", phone: "+91 98765 00002", created_at: "2026-01-01 10:00:00" }
      ];

      localStorage.setItem('sb_products', JSON.stringify(initialProducts));
      localStorage.setItem('sb_customers', JSON.stringify(initialCustomers));
      localStorage.setItem('sb_settings', JSON.stringify(initialSettings));
      localStorage.setItem('sb_invoices', JSON.stringify(initialInvoices));
      localStorage.setItem('sb_users', JSON.stringify(initialUsers));
      localStorage.setItem('sb_inventory_logs', JSON.stringify([]));
      localStorage.setItem('sb_initialized', 'true');
    }
  }

  private localFallback<T>(endpoint: string, options: RequestInit): T {
    this.initLocalDb();
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Health
    if (endpoint === '/health') {
      return { status: "local_preview", service: "AI Smart Billing System (Local Engine)", database: "SQLite-Emulated" } as T;
    }

    // 2. Auth Login
    if (endpoint === '/auth/login' && method === 'POST') {
      const users: User[] = JSON.parse(localStorage.getItem('sb_users') || '[]');
      const found = users.find(u => u.username === body.username);
      if (found && (body.password === 'admin123' || body.password === 'staff123' || body.password === 'password')) {
        return {
          access_token: `mock_jwt_token_${found.role}_${found.id}`,
          token_type: "bearer",
          user: found
        } as T;
      }
      throw new Error("Invalid username or password. (Use admin / admin123 or staff / staff123)");
    }

    // Auth Me
    if (endpoint === '/auth/me') {
      const savedUser = localStorage.getItem('smart_billing_user');
      if (savedUser) return JSON.parse(savedUser) as T;
      return { id: 1, username: "admin", full_name: "Store Manager (Admin)", role: "admin" } as T;
    }

    // 3. Settings
    if (endpoint === '/settings') {
      if (method === 'GET') {
        return JSON.parse(localStorage.getItem('sb_settings') || '{}') as T;
      }
      if (method === 'PUT') {
        localStorage.setItem('sb_settings', JSON.stringify(body));
        return { message: "Store settings updated successfully" } as T;
      }
    }

    // 4. Products
    if (endpoint.startsWith('/products')) {
      let products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      
      if (endpoint === '/products' || endpoint.startsWith('/products?')) {
        if (method === 'GET') {
          return products as T;
        }
        if (method === 'POST') {
          const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
          const status = body.stock_quantity === 0 ? 'Out of Stock' : (body.stock_quantity <= body.min_stock_level ? 'Low Stock' : 'In Stock');
          const newProduct: Product = { ...body, id: newId, status };
          products.push(newProduct);
          localStorage.setItem('sb_products', JSON.stringify(products));
          return { message: "Product created successfully", product_id: newId } as T;
        }
      }

      const matchId = endpoint.match(/\/products\/(\d+)/);
      if (matchId) {
        const prodId = parseInt(matchId[1]);
        if (method === 'GET') {
          const found = products.find(p => p.id === prodId);
          if (!found) throw new Error("Product not found");
          return found as T;
        }
        if (method === 'PUT') {
          const idx = products.findIndex(p => p.id === prodId);
          if (idx === -1) throw new Error("Product not found");
          const existing = products[idx];
          const updatedQty = body.stock_quantity !== undefined ? body.stock_quantity : existing.stock_quantity;
          const updatedMin = body.min_stock_level !== undefined ? body.min_stock_level : existing.min_stock_level;
          const status = updatedQty === 0 ? 'Out of Stock' : (updatedQty <= updatedMin ? 'Low Stock' : 'In Stock');
          products[idx] = { ...existing, ...body, status };
          localStorage.setItem('sb_products', JSON.stringify(products));
          return { message: "Product updated successfully" } as T;
        }
        if (method === 'DELETE') {
          products = products.filter(p => p.id !== prodId);
          localStorage.setItem('sb_products', JSON.stringify(products));
          return { message: "Product deleted successfully" } as T;
        }
      }
    }

    // 5. Customers
    if (endpoint.startsWith('/customers')) {
      let customers: Customer[] = JSON.parse(localStorage.getItem('sb_customers') || '[]');
      if (endpoint === '/customers' || endpoint.startsWith('/customers?')) {
        if (method === 'GET') return customers as T;
        if (method === 'POST') {
          const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
          const newCustomer: Customer = { ...body, id: newId, total_purchases: 0, invoice_count: 0 };
          customers.push(newCustomer);
          localStorage.setItem('sb_customers', JSON.stringify(customers));
          return { message: "Customer created successfully", customer_id: newId, ...newCustomer } as T;
        }
      }
      const matchId = endpoint.match(/\/customers\/(\d+)/);
      if (matchId) {
        const custId = parseInt(matchId[1]);
        if (method === 'GET') {
          const found = customers.find(c => c.id === custId);
          if (!found) throw new Error("Customer not found");
          const invoices: Invoice[] = JSON.parse(localStorage.getItem('sb_invoices') || '[]');
          return { ...found, invoices: invoices.filter(inv => inv.customer_id === custId) } as T;
        }
      }
    }

    // 6. Invoices (Create Bill)
    if (endpoint.startsWith('/invoices')) {
      let invoices: Invoice[] = JSON.parse(localStorage.getItem('sb_invoices') || '[]');
      let products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      let customers: Customer[] = JSON.parse(localStorage.getItem('sb_customers') || '[]');

      if (endpoint === '/invoices' && method === 'POST') {
        const year = new Date().getFullYear();
        const invoiceNum = `INV-${year}-${String(invoices.length + 1).padStart(4, '0')}`;
        
        let subtotal = 0;
        let taxTotal = 0;
        const itemRecords: InvoiceItem[] = [];

        // Validate and reduce stock
        for (const itm of body.items) {
          const pIndex = products.findIndex(p => p.id === itm.product_id);
          if (pIndex === -1) throw new Error(`Product ID ${itm.product_id} not found`);
          const prod = products[pIndex];

          if (prod.stock_quantity < itm.quantity) {
            throw new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stock_quantity}`);
          }

          const base = itm.unit_price * itm.quantity;
          const tax = Math.round((base * (itm.tax_rate / 100)) * 100) / 100;
          const total = base + tax;
          subtotal += base;
          taxTotal += tax;

          // Reduce product stock
          const newStock = prod.stock_quantity - itm.quantity;
          prod.stock_quantity = newStock;
          prod.status = newStock === 0 ? 'Out of Stock' : (newStock <= prod.min_stock_level ? 'Low Stock' : 'In Stock');

          itemRecords.push({
            product_id: prod.id,
            product_name: prod.name,
            sku: prod.sku,
            quantity: itm.quantity,
            unit_price: itm.unit_price,
            tax_rate: itm.tax_rate,
            item_tax: tax,
            item_total: total
          });
        }

        const discount = Number(body.discount_amount || 0);
        const grandTotal = Math.round(Math.max(0, (subtotal - discount) + taxTotal) * 100) / 100;

        const newInvoice: Invoice = {
          id: invoices.length + 1,
          invoice_number: invoiceNum,
          customer_id: body.customer_id,
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          subtotal: Math.round(subtotal * 100) / 100,
          discount_amount: discount,
          tax_amount: Math.round(taxTotal * 100) / 100,
          grand_total: grandTotal,
          payment_method: body.payment_method,
          payment_status: body.payment_status,
          staff_id: 1,
          staff_name: "Staff",
          notes: body.notes || "",
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          items: itemRecords,
          store: JSON.parse(localStorage.getItem('sb_settings') || '{}')
        };

        // Update customer total
        if (body.customer_id) {
          const cIndex = customers.findIndex(c => c.id === body.customer_id);
          if (cIndex !== -1) {
            customers[cIndex].total_purchases = (customers[cIndex].total_purchases || 0) + grandTotal;
            customers[cIndex].invoice_count = (customers[cIndex].invoice_count || 0) + 1;
          }
        }

        invoices.unshift(newInvoice);
        localStorage.setItem('sb_invoices', JSON.stringify(invoices));
        localStorage.setItem('sb_products', JSON.stringify(products));
        localStorage.setItem('sb_customers', JSON.stringify(customers));

        return newInvoice as T;
      }

      if (endpoint === '/invoices' || endpoint.startsWith('/invoices?')) {
        return invoices as T;
      }

      const matchId = endpoint.match(/\/invoices\/(\d+)/);
      if (matchId) {
        const inv = invoices.find(i => i.id === parseInt(matchId[1]));
        if (!inv) throw new Error("Invoice not found");
        return { ...inv, store: JSON.parse(localStorage.getItem('sb_settings') || '{}') } as T;
      }
    }

    // 7. Inventory
    if (endpoint === '/inventory') {
      const products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      const inStock = products.filter(p => p.status === 'In Stock').length;
      const lowStock = products.filter(p => p.status === 'Low Stock').length;
      const outOfStock = products.filter(p => p.status === 'Out of Stock').length;
      const attention = products.filter(p => p.stock_quantity <= p.min_stock_level);

      return {
        summary: { total_products: products.length, in_stock: inStock, low_stock: lowStock, out_of_stock: outOfStock },
        attention_items: attention
      } as T;
    }

    if (endpoint === '/inventory/adjust' && method === 'POST') {
      const products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      const pIndex = products.findIndex(p => p.id === body.product_id);
      if (pIndex === -1) throw new Error("Product not found");
      const prod = products[pIndex];
      const newStock = prod.stock_quantity + body.quantity_change;
      if (newStock < 0) throw new Error("Cannot adjust stock below 0");
      prod.stock_quantity = newStock;
      prod.status = newStock === 0 ? 'Out of Stock' : (newStock <= prod.min_stock_level ? 'Low Stock' : 'In Stock');
      localStorage.setItem('sb_products', JSON.stringify(products));
      return { message: "Stock adjusted successfully", new_stock: newStock, status: prod.status } as T;
    }

    // 8. Sales
    if (endpoint.startsWith('/sales')) {
      const invoices: Invoice[] = JSON.parse(localStorage.getItem('sb_invoices') || '[]');
      return invoices as T;
    }

    // 9. Reports Summary
    if (endpoint === '/reports/summary') {
      const invoices: Invoice[] = JSON.parse(localStorage.getItem('sb_invoices') || '[]');
      const products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock_level).length;

      const totalRev = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);

      return {
        today: { revenue: totalRev > 0 ? invoices[0]?.grand_total || 0 : 0, invoices: invoices.length > 0 ? 1 : 0 },
        month: { revenue: totalRev, invoices: invoices.length },
        all_time: { revenue: totalRev, invoices: invoices.length },
        low_stock_count: lowStockCount,
        top_selling_products: [
          { product_name: "Wireless Ergonomic Mouse", sku: "EL-MS-001", total_units_sold: 14, total_revenue: 11900 },
          { product_name: "65W GaN Fast Charger", sku: "EL-CH-004", total_units_sold: 9, total_revenue: 11691 }
        ],
        payment_breakdown: [
          { payment_method: "UPI", invoice_count: Math.ceil(invoices.length * 0.6) || 1, total_amount: Math.round(totalRev * 0.6) },
          { payment_method: "Cash", invoice_count: Math.floor(invoices.length * 0.4) || 1, total_amount: Math.round(totalRev * 0.4) }
        ],
        daily_trends: [
          { date: "2026-10-02", day_name: "Fri", revenue: 1450, invoices: 1 },
          { date: "2026-10-03", day_name: "Sat", revenue: 4200, invoices: 2 },
          { date: "2026-10-04", day_name: "Sun", revenue: 6890, invoices: 3 },
          { date: "2026-10-05", day_name: "Mon", revenue: 3100, invoices: 2 },
          { date: "2026-10-06", day_name: "Tue", revenue: 5200, invoices: 2 },
          { date: "2026-10-07", day_name: "Wed", revenue: 2476, invoices: 1 },
          { date: "2026-10-08", day_name: "Thu", revenue: totalRev, invoices: invoices.length }
        ],
        recent_invoices: invoices.slice(0, 5)
      } as T;
    }

    // 10. AI Chat fallback
    if (endpoint === '/ai/chat' && method === 'POST') {
      const q = (body.message || '').toLowerCase();
      const products: Product[] = JSON.parse(localStorage.getItem('sb_products') || '[]');
      const lowItems = products.filter(p => p.stock_quantity <= p.min_stock_level);
      
      let reply = "";
      if (q.includes('restock') || q.includes('low stock') || q.includes('inventory')) {
        reply = `### Low Stock & Restock Alert\nBased on your live store inventory, ${lowItems.length} items require attention:\n` +
          lowItems.map(p => `- **${p.name}** (Current stock: ${p.stock_quantity}, Min required: ${p.min_stock_level})`).join('\n') +
          `\n\n*Action*: Reorder these items from their respective suppliers to avoid customer stockouts.`;
      } else if (q.includes('selling') || q.includes('popular') || q.includes('top product')) {
        reply = `### Top-Selling Products\nAccording to customer billing history:\n1. **Wireless Ergonomic Mouse** (14 units sold, Revenue: ₹11,900)\n2. **65W GaN Fast Charger** (9 units sold, Revenue: ₹11,691)\n3. **Mechanical RGB Keyboard** (4 units sold, Revenue: ₹9,996)`;
      } else if (q.includes('summary') || q.includes('month') || q.includes('today')) {
        reply = `### Business Performance Summary\n- **Inventory Status:** ${products.length} catalog products.\n- **Low Stock Warnings:** ${lowItems.length} items need replenishment.\n- **Sales Health:** Healthy transaction flow with prompt UPI & Cash settlements.`;
      } else {
        reply = `### Store Assistant Response\nHere is your real-time shop overview:\n- Total Catalog Products: **${products.length}**\n- Critical Low Stock Items: **${lowItems.length}**\n- Recommended Restock: **${lowItems[0]?.name || 'All items well stocked'}**\n\n*(When running locally with Python FastAPI, this connects directly to Google Gemini 2.5 Flash for natural conversational answers!)*`;
      }

      return {
        reply,
        mode: "live_data_local_engine",
        api_key_configured: false
      } as T;
    }

    // 11. Staff Management
    if (endpoint === '/users') {
      const users: User[] = JSON.parse(localStorage.getItem('sb_users') || '[]');
      if (method === 'GET') return users as T;
      if (method === 'POST') {
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser: User = {
          id: newId,
          username: body.username,
          full_name: body.full_name,
          role: body.role || 'staff',
          phone: body.phone || '',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        users.push(newUser);
        localStorage.setItem('sb_users', JSON.stringify(users));
        return { message: "User created successfully", user_id: newId } as T;
      }
    }

    if (endpoint.startsWith('/users/') && method === 'DELETE') {
      const userId = parseInt(endpoint.split('/')[2]);
      let users: User[] = JSON.parse(localStorage.getItem('sb_users') || '[]');
      users = users.filter(u => u.id !== userId);
      localStorage.setItem('sb_users', JSON.stringify(users));
      return { message: "User deleted successfully" } as T;
    }

    throw new Error(`Endpoint ${endpoint} not supported`);
  }

  // API Methods
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.access_token);
    localStorage.setItem('smart_billing_user', JSON.stringify(data.user));
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getSettings(): Promise<StoreSettings> {
    return this.request<StoreSettings>('/settings');
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<any> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async getProducts(params?: { search?: string; category?: string; status?: string }): Promise<Product[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    const query = q.toString() ? `?${q.toString()}` : '';
    return this.request<Product[]>(`/products${query}`);
  }

  async createProduct(product: Partial<Product>): Promise<any> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  async deleteProduct(id: number): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  async getCustomers(search?: string): Promise<Customer[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Customer[]>(`/customers${q}`);
  }

  async getCustomer(id: number): Promise<Customer & { invoices?: Invoice[] }> {
    return this.request<Customer & { invoices?: Invoice[] }>(`/customers/${id}`);
  }

  async createCustomer(customer: Partial<Customer>): Promise<any> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }

  async createInvoice(invoiceData: {
    customer_id?: number | null;
    customer_name: string;
    customer_phone?: string;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      tax_rate: number;
    }[];
    discount_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
  }): Promise<Invoice> {
    return this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }

  async getInvoices(search?: string, payment_status?: string): Promise<Invoice[]> {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    if (payment_status) q.append('payment_status', payment_status);
    const query = q.toString() ? `?${q.toString()}` : '';
    return this.request<Invoice[]>(`/invoices${query}`);
  }

  async getInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async getInventory(): Promise<{ summary: any; attention_items: Product[] }> {
    return this.request('/inventory');
  }

  async adjustInventory(productId: number, quantityChange: number, reason: string): Promise<any> {
    return this.request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity_change: quantityChange, reason })
    });
  }

  async getInventoryLogs(): Promise<InventoryLog[]> {
    return this.request<InventoryLog[]>('/inventory/logs');
  }

  async getSales(dateFilter?: string, paymentStatus?: string): Promise<Invoice[]> {
    const q = new URLSearchParams();
    if (dateFilter) q.append('date_filter', dateFilter);
    if (paymentStatus) q.append('payment_status', paymentStatus);
    const query = q.toString() ? `?${q.toString()}` : '';
    return this.request<Invoice[]>(`/sales${query}`);
  }

  async getReportsSummary(): Promise<ReportSummary> {
    return this.request<ReportSummary>('/reports/summary');
  }

  async askAI(message: string): Promise<{ reply: string; mode: string; api_key_configured: boolean; note?: string }> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(user: Partial<User> & { password: string }): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async deleteUser(userId: number): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiService();
