import React from 'react';
import { Invoice, StoreSettings } from '../types';
import { Printer, X, CheckCircle, Clock, Store, ShieldCheck, ArrowDownToLine } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  storeSettings?: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, storeSettings, onClose }) => {
  if (!invoice) return null;

  const store = invoice.store || storeSettings || {
    store_name: "Apex Retail & Electronics",
    tagline: "Quality Goods & Reliable Service",
    phone: "+91 98765 43210",
    email: "support@apexretail.local",
    address: "Shop 14, Commercial Plaza, M.G. Road",
    gst_tax_number: "27AABCA1234F1Z8",
    currency_symbol: "₹",
    default_tax_rate: 18.0
  };

  const currency = store.currency_symbol || '₹';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden print-container">
        {/* Modal Toolbar - Hidden during Print */}
        <div className="no-print bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30">
              Tax Invoice
            </span>
            <span className="font-mono text-sm text-slate-200 font-semibold">{invoice.invoice_number}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 text-slate-800 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 mb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-base">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{store.store_name}</h1>
                  <p className="text-xs text-slate-500">{store.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-xs">{store.address}</p>
              <p className="text-xs text-slate-500 mt-0.5">Phone: {store.phone} | Email: {store.email}</p>
              {store.gst_tax_number && (
                <p className="text-xs font-medium text-slate-700 mt-1">
                  GSTIN / Tax ID: <span className="font-mono font-semibold">{store.gst_tax_number}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider rounded">
                TAX INVOICE / CASH BILL
              </span>
              <div className="mt-2 text-xs">
                <div className="text-slate-500">Invoice No:</div>
                <div className="font-mono font-bold text-slate-900 text-sm">{invoice.invoice_number}</div>
              </div>
              <div className="mt-1 text-xs">
                <div className="text-slate-500">Date & Time:</div>
                <div className="font-medium text-slate-700">{invoice.created_at}</div>
              </div>
            </div>
          </div>

          {/* Billed To & Cashier Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                Billed To (Customer):
              </span>
              <div className="font-bold text-slate-900 text-sm">{invoice.customer_name}</div>
              {invoice.customer_phone && (
                <div className="text-slate-600 mt-0.5">Phone: {invoice.customer_phone}</div>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Billing Details:
                </span>
                <div className="text-slate-700">Billed by: <span className="font-semibold text-slate-900">{invoice.staff_name}</span></div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold text-slate-800">{invoice.payment_method}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 ${
                  invoice.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.payment_status === 'Paid' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1" />}
                  {invoice.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="mb-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-3 text-right">Rate ({currency})</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.product_name}
                        {item.sku && <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.sku}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{item.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {item.tax_rate}% <span className="text-[10px] text-slate-400">({currency}{item.item_tax.toFixed(2)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{item.item_total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 italic">No item details available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-between items-start pt-2 border-t border-slate-200 text-xs">
            <div className="w-1/2 pr-4">
              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center text-slate-700 font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Terms & Conditions:
                </div>
                <p>1. Computer generated invoice; no physical signature required.</p>
                <p>2. Please preserve this receipt for returns or warranty claims within 7 days.</p>
                <p>3. Tax calculated in accordance with relevant retail provisions.</p>
              </div>
              {invoice.notes && (
                <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                  <span className="font-semibold">Note:</span> {invoice.notes}
                </div>
              )}
            </div>

            <div className="w-1/2 pl-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{currency}{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">- {currency}{invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax (Included/Added):</span>
                  <span className="font-mono font-medium">{currency}{invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-blue-700">{currency}{invoice.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
            Thank you for shopping with {store.store_name}! Visit us again soon.
          </div>
        </div>

        {/* Modal Bottom Close Button */}
        <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Receipt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
