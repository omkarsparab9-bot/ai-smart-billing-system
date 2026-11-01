import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ReportSummary, StoreSettings } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Printer, 
  Award, 
  CreditCard, 
  QrCode, 
  Banknote, 
  AlertTriangle,
  Receipt,
  Download
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [rep, sets] = await Promise.all([
          api.getReportsSummary(),
          api.getSettings(),
        ]);
        setReports(rep);
        setStoreSettings(sets);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const currency = storeSettings?.currency_symbol || '₹';

  const averageInvoiceValue =
    reports && reports.all_time.invoices > 0
      ? reports.all_time.revenue / reports.all_time.invoices
      : 0;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Print action */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Business Sales Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Practical billing performance, revenue breakdown, and top-moving products.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Sales Report</span>
        </button>
      </div>

      {/* Print only header */}
      <div className="hidden print-only mb-6">
        <h1 className="text-2xl font-bold">{storeSettings?.store_name} - Sales & Business Report</h1>
        <p className="text-xs text-slate-600">Generated on {new Date().toLocaleString()}</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Today's Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {currency}{reports?.today.revenue.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {reports?.today.invoices || 0} bill{reports?.today.invoices !== 1 ? 's' : ''} generated today
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            This Month's Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {currency}{reports?.month.revenue.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {reports?.month.invoices || 0} bills this month
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            All-Time Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {currency}{reports?.all_time.revenue.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Total {reports?.all_time.invoices || 0} historical bills
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Avg. Bill Value (AIV)
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
            {currency}{averageInvoiceValue.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Average customer basket size
          </span>
        </div>
      </div>

      {/* Grid: Top-Selling Products (8 cols) & Payment Mode Distribution (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top-Selling Products */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top-Selling Products</h3>
              <p className="text-[11px] text-slate-500">Highest volume goods ranked by units sold</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports?.top_selling_products && reports.top_selling_products.length > 0 ? (
                  reports.top_selling_products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold font-mono text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {item.sku}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-sm">
                        {item.total_units_sold}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                        {currency}{item.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No sales data available yet to rank top products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Payment Settlements</h3>
                <p className="text-[11px] text-slate-500">Method distribution of bills</p>
              </div>
            </div>

            <div className="space-y-3">
              {reports?.payment_breakdown && reports.payment_breakdown.length > 0 ? (
                reports.payment_breakdown.map((pm, idx) => {
                  const totalAmt = reports.all_time.revenue || 1;
                  const pct = Math.min(100, Math.round((pm.total_amount / totalAmt) * 100));

                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <span className="flex items-center space-x-1.5">
                          {pm.payment_method === 'UPI' && <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                          {pm.payment_method === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {pm.payment_method === 'Card' && <CreditCard className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{pm.payment_method}</span>
                        </span>
                        <span className="font-mono text-slate-900">
                          {currency}{pm.total_amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          style={{ width: `${pct}%` }}
                          className="bg-blue-600 h-full rounded-full"
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>{pm.invoice_count} bills</span>
                        <span>{pct}% of revenue</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No payment records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Daily Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Daily Sales Log (Last 7 Days)</h3>
        <p className="text-[11px] text-slate-500 mb-4">Detailed day-by-day revenue receipts</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Day of Week</th>
                <th className="py-2.5 px-3 text-center">Invoices Count</th>
                <th className="py-2.5 px-3 text-right">Daily Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports?.daily_trends && reports.daily_trends.length > 0 ? (
                reports.daily_trends.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-700">{d.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.day_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{d.invoices}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                      {currency}{d.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No trend records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
