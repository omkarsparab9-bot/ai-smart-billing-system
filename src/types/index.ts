export type UserRole = 'admin' | 'staff';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface StoreSettings {
  id?: number;
  store_name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_tax_number?: string;
  currency_symbol: string;
  default_tax_rate: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  tax_rate: number;
  supplier?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  created_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_purchases: number;
  invoice_count: number;
  created_at?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  tax_rate: number;
  item_tax: number;
  item_total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  payment_status: 'Paid' | 'Pending';
  staff_id: number;
  staff_name: string;
  notes?: string;
  created_at: string;
  items?: InvoiceItem[];
  store?: StoreSettings;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  change_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface ReportSummary {
  today: { revenue: number; invoices: number };
  month: { revenue: number; invoices: number };
  all_time: { revenue: number; invoices: number };
  low_stock_count: number;
  top_selling_products: {
    product_name: string;
    sku: string;
    total_units_sold: number;
    total_revenue: number;
  }[];
  payment_breakdown: {
    payment_method: string;
    invoice_count: number;
    total_amount: number;
  }[];
  daily_trends: {
    date: string;
    day_name: string;
    revenue: number;
    invoices: number;
  }[];
  recent_invoices: Invoice[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}
