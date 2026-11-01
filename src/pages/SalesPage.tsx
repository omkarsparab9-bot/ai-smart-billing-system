import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Invoice, StoreSettings } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Eye, 
  ArrowUpDown,
  Download,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Invoice[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadSales = async () => {
    try {
      const [salesData, sets] = await Promise.all([
        api.getSales(dateFilter === 'all' ? undefined : dateFilter, paymentStatusFilter),
        api.getSettings(),
      ]);
      setSales(salesData);
      setStoreSettings(sets);
    } catch (err) {
      console.error("Failed to load sales", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [dateFilter, paymentStatusFilter]);

  const currency = storeSettings?.currency_symbol || '₹';

  // Filtered & sorted
  const processedSales = sales
    .filter((s) => {
      const matchesSearch =
        s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.staff_name && s.staff_name.toLowerCase().includes(search.toLowerCase()));
      const matchesMethod = paymentMethodFilter === 'All' || s.payment_method === paymentMethodFilter;
      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.grand_total - b.grand_total : b.grand_total - a.grand_total;
      }
      return sortOrder === 'asc'
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at);
    });

  const totalCollected = processedSales
    .filter((s) => s.payment_status === 'Paid')
    .reduce((sum, s) => sum + s.grand_total, 0);

  const totalPending = processedSales
    .filter((s) => s.payment_status === 'Pending')
    .reduce((sum, s) => sum + s.grand_total, 0);

  const handleOpenInvoice = async (id: number) => {
    try {
      const full = await api.getInvoice(id);
      setSelectedInvoice(full);
    } catch {
      alert("Failed to load invoice");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Summary stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sales & Revenue Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time retail transactions recorded directly in SQLite database.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold">Settled (Paid)</span>
            <span className="text-base font-bold text-emerald-800 font-mono">{currency}{totalCollected.toFixed(2)}</span>
          </div>
          {totalPending > 0 && (
            <div className="bg-amber-50 px-3.5 py-2 rounded-lg border border-amber-200">
              <span className="text-amber-700 block text-[10px] uppercase font-bold">Credit (Pending)</span>
              <span className="text-base font-bold text-amber-800 font-mono">{currency}{totalPending.toFixed(2)}</span>
            </div>
          )}
          <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Sales Count</span>
            <span className="text-base font-bold text-slate-900 font-mono">{processedSales.length}</span>
          </div>
        </div>
      </div>

      {/* Filters: Time period, Search, Payment status & Sort */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time range buttons */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium mr-1">Timeframe:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDateFilter(p.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  dateFilter === p.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by invoice, customer, or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status & Method filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                <option value="All">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Payment Mode:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
              >
                <option value="All">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
            >
              <option value="date">Date & Time</option>
              <option value="amount">Invoice Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 cursor-pointer"
              title="Toggle ascending / descending"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Billing Staff</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedSales.length > 0 ? (
                processedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {s.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {s.customer_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {s.created_at}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="inline-flex items-center space-x-1">
                        <span>{s.payment_method}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.staff_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {currency}{s.grand_total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenInvoice(s.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-xs font-semibold inline-flex items-center space-x-1 border border-slate-200 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No sales transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        storeSettings={storeSettings || undefined}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
