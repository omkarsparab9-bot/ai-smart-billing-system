import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, StoreSettings, InventoryLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RotateCw, 
  Search, 
  ArrowUpRight, 
  History,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');

  // Search & Filter
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState<string>('10');
  const [reason, setReason] = useState<string>('Supplier Shipment Restock');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInventoryData = async () => {
    try {
      const [prods, logList, sets] = await Promise.all([
        api.getProducts(),
        api.getInventoryLogs(),
        api.getSettings(),
      ]);
      setProducts(prods);
      setLogs(logList);
      setStoreSettings(sets);
    } catch (err: any) {
      setErrorMsg("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const currency = storeSettings?.currency_symbol || '₹';

  const inStockCount = products.filter((p) => p.status === 'In Stock').length;
  const lowStockCount = products.filter((p) => p.status === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenRestock = (product?: Product) => {
    if (product) {
      setSelectedProductId(product.id);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
    setRestockQty('10');
    setReason('Supplier Shipment Delivery');
    setShowRestockModal(true);
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty === 0) {
      alert("Please enter a valid stock quantity change");
      return;
    }

    try {
      await api.adjustInventory(selectedProductId, qty, reason);
      setSuccessMsg(`Inventory updated successfully!`);
      setShowRestockModal(false);
      loadInventoryData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to adjust stock");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* Header and Restock Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventory & Stock Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor product stock thresholds, restock goods, and inspect audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={() => handleOpenRestock()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Restock / Adjust Stock</span>
            </button>
          )}
        </div>
      </div>

      {/* Inventory Status Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Catalog Items
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {products.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">SKU tracking enabled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Healthy In-Stock
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {inStockCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ready for counter billing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {lowStockCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Below safety threshold</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Out of Stock
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {outOfStockCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Zero stock available</span>
        </div>
      </div>

      {/* Tabs: Active Inventory vs Movement Logs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Product Stock Levels
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 px-3 font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Inventory Audit Logs</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-500 font-medium">Status Filter:</span>
              {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((st) => (
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

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Safety Threshold</th>
                    <th className="py-3 px-4">Status & Health</th>
                    <th className="py-3 px-4">Supplier</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0;
                    const isOut = p.stock_quantity === 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500 text-[11px]">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.category}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                          {p.stock_quantity}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {p.min_stock_level} units
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {p.supplier || '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenRestock(p)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-200"
                            >
                              + Restock
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Logs Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4 text-center">Stock Before</th>
                  <th className="py-3 px-4 text-center">Stock After</th>
                  <th className="py-3 px-4">Reference / Invoice</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {l.created_at}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {l.product_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.change_type === 'Sale'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {l.change_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={l.quantity_change < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {l.quantity_change > 0 ? `+${l.quantity_change}` : l.quantity_change}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {l.previous_stock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {l.new_stock}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {l.reference_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {l.notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No inventory logs recorded yet. Stock movement during billing or restocking will automatically appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Restock Product Inventory</span>
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleExecuteRestock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.stock_quantity}) - {p.sku}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity to Add (or Subtract if negative) *
                </label>
                <input
                  type="number"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="e.g. 20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Order Reference</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="e.g. Batch PO #994 received"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
