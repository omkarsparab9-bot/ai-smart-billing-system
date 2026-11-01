import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Invoice, StoreSettings } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { Search, Printer, Eye, FileText, CheckCircle2, Clock, Filter, ArrowUpDown } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadInvoices = async () => {
    try {
      const [invList, sets] = await Promise.all([
        api.getInvoices(search, statusFilter),
        api.getSettings(),
      ]);
      setInvoices(invList);
      setStoreSettings(sets);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter]);

  const currency = storeSettings?.currency_symbol || '₹';

  const handleOpenReceipt = async (invoiceId: number) => {
    try {
      const full = await api.getInvoice(invoiceId);
      setSelectedInvoice(full);
    } catch (err) {
      alert("Failed to load invoice details");
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Invoice Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, view, audit and re-print customer receipts.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Invoices</span>
            <span className="text-base font-bold text-slate-900 font-mono">{invoices.length}</span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Billed Revenue</span>
            <span className="text-base font-bold text-blue-700 font-mono">{currency}{totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          {['All', 'Paid', 'Pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inv.customer_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {inv.customer_phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {inv.created_at}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {inv.payment_method}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {currency}{inv.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                      {currency}{inv.tax_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {currency}{inv.grand_total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.payment_status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenReceipt(inv.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md font-semibold text-xs inline-flex items-center space-x-1 transition cursor-pointer border border-slate-200"
                        title="View / Print Tax Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No invoices found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        storeSettings={storeSettings || undefined}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
