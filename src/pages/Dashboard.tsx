import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReportSummary, Product, Invoice, StoreSettings } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { 
  IndianRupee, 
  Receipt, 
  Package, 
  AlertTriangle, 
  Users, 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Eye,
  ShoppingBag,
  Sparkles,
  Boxes
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rep, prods, custs, sets] = await Promise.all([
          api.getReportsSummary(),
          api.getProducts(),
          api.getCustomers(),
          api.getSettings(),
        ]);
        setReports(rep);
        setProducts(prods);
        setCustomerCount(custs.length);
        setSettings(sets);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currency = settings?.currency_symbol || '₹';
  const lowStockItems = products.filter((p) => p.stock_quantity <= p.min_stock_level);

  const handleViewInvoice = async (invId: number) => {
    try {
      const inv = await api.getInvoice(invId);
      setSelectedInvoice(inv);
    } catch (err) {
      alert("Failed to load invoice receipt");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {settings?.store_name || 'Apex Retail Store'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily shop overview, retail sales metrics, and stock alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('billing')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill (POS)</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200"
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
          </button>
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer border border-indigo-200"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Advice</span>
          </button>
        </div>
      </div>

      {/* 5 Key Practical Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {currency}{reports?.today.revenue.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Collected from today's bills
            </div>
          </div>
        </div>

        {/* Today's Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Today's Invoices
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {reports?.today.invoices || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Billed today at counter
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {products.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Items in active catalog
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Items
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-bold font-mono ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockItems.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {lowStockItems.length > 0 ? 'Needs restock order' : 'Stock levels normal'}
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900">
              {customerCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Registered customer profiles
            </div>
          </div>
        </div>
      </div>

      {/* Center Grid: 7-Day Sales Trend & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">7-Day Sales Velocity</h3>
              <p className="text-[11px] text-slate-500">Daily billed revenue over the last week</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simple Clean Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {reports?.daily_trends && reports.daily_trends.length > 0 ? (
              reports.daily_trends.map((item, idx) => {
                const maxRev = Math.max(...reports.daily_trends.map((d) => d.revenue), 1000);
                const heightPercent = Math.max(12, Math.min(100, (item.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {currency}{item.revenue.toFixed(0)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                        idx === reports.daily_trends.length - 1
                          ? 'bg-blue-600 group-hover:bg-blue-500'
                          : 'bg-slate-200 group-hover:bg-blue-300'
                      }`}
                    />
                    <div className="text-[11px] font-semibold text-slate-600 mt-2">
                      {item.day_name}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {item.date.slice(5)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-slate-400 text-xs py-8">
                No recent transaction trends recorded yet
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Overall All-Time Invoices: <strong>{reports?.all_time.invoices || 0}</strong></span>
            <span>Total Revenue Generated: <strong className="text-slate-800 font-mono">{currency}{reports?.all_time.revenue.toFixed(2) || '0.00'}</strong></span>
          </div>
        </div>

        {/* Low Stock Attention List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Inventory Alerts</h3>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Manage
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Products at or below their safety threshold:
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-lg text-center text-emerald-800 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  All products have sufficient stock levels!
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku} • Min: {item.min_stock_level}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.stock_quantity === 0 ? 'Out of Stock' : `${item.stock_quantity} left`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Open Inventory Manager</span>
          </button>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Customer Bills</h3>
            <p className="text-[11px] text-slate-500">Latest transactions saved to SQLite database</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            View All Invoices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports?.recent_invoices && reports.recent_invoices.length > 0 ? (
                reports.recent_invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {inv.customer_name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {inv.created_at}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {inv.payment_method}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {currency}{inv.grand_total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleViewInvoice(inv.id)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="View / Print Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No billing records generated yet. Click "New Bill" to generate your first invoice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for Viewing and Printing */}
      <InvoiceModal
        invoice={selectedInvoice}
        storeSettings={settings || undefined}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
