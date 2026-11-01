import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Customer, StoreSettings, Invoice } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Receipt, 
  Calendar, 
  Eye, 
  Edit, 
  CheckCircle2, 
  X
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<(Customer & { invoices?: Invoice[] }) | null>(null);
  const [viewInvoiceReceipt, setViewInvoiceReceipt] = useState<Invoice | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      const [custs, sets] = await Promise.all([
        api.getCustomers(search),
        api.getSettings(),
      ]);
      setCustomers(custs);
      setStoreSettings(sets);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const currency = storeSettings?.currency_symbol || '₹';

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Name and Phone number are required.");
      return;
    }

    try {
      if (editingCustomer) {
        await api.createCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        });
        setSuccessMsg(`Customer '${name}' updated!`);
      } else {
        await api.createCustomer({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        });
        setSuccessMsg(`Customer '${name}' created successfully!`);
      }

      setShowAddModal(false);
      loadCustomers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save customer");
    }
  };

  const handleViewHistory = async (customerId: number) => {
    try {
      const full = await api.getCustomer(customerId);
      setSelectedCustomerHistory(full);
    } catch (err: any) {
      alert("Failed to load customer purchase history");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* Header and Add Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store buyer directory, purchase loyalty tracking, and invoice history.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            Total Customers: <strong className="text-slate-900 font-mono">{customers.length}</strong>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Bills Count</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length > 0 ? (
                customers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                      {c.address || '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {c.invoice_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 text-sm">
                      {currency}{c.total_purchases.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleViewHistory(c.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer border border-slate-200"
                          title="View customer billing records"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No customers found. Click "Register Customer" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Purchase History Modal */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Customer Billing History: {selectedCustomerHistory.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: {selectedCustomerHistory.phone} • Lifetime Purchases: {currency}{selectedCustomerHistory.total_purchases.toFixed(2)}
                </p>
              </div>
              <button onClick={() => setSelectedCustomerHistory(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCustomerHistory.invoices && selectedCustomerHistory.invoices.length > 0 ? (
                    selectedCustomerHistory.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{inv.created_at}</td>
                        <td className="py-2.5 px-3 text-slate-700">{inv.payment_method} ({inv.payment_status})</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{currency}{inv.grand_total.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={async () => {
                              const fullInv = await api.getInvoice(inv.id);
                              setViewInvoiceReceipt(fullInv);
                            }}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No invoices associated with this customer yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingCustomer ? 'Edit Customer' : 'Register New Customer'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Desai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98200 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. meera@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing / Delivery Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Pin code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  {editingCustomer ? 'Save Changes' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice receipt viewer */}
      <InvoiceModal
        invoice={viewInvoiceReceipt}
        storeSettings={storeSettings || undefined}
        onClose={() => setViewInvoiceReceipt(null)}
      />
    </div>
  );
};
