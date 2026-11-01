import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, StoreSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Filter, 
  ArrowUpDown,
  Tag
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter & Sort
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Electronics');
  const [sku, setSku] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('10');
  const [minStockLevel, setMinStockLevel] = useState<string>('5');
  const [taxRate, setTaxRate] = useState<string>('18.0');
  const [supplier, setSupplier] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const [prods, sets] = await Promise.all([
        api.getProducts(),
        api.getSettings(),
      ]);
      setProducts(prods);
      setStoreSettings(sets);
    } catch (err: any) {
      setErrorMsg("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const currency = storeSettings?.currency_symbol || '₹';

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering & Sorting
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      if (sortBy === 'price') comparison = a.price - b.price;
      if (sortBy === 'stock') comparison = a.stock_quantity - b.stock_quantity;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Electronics');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setPrice('');
    setCostPrice('');
    setStockQuantity('15');
    setMinStockLevel('5');
    setTaxRate(storeSettings?.default_tax_rate?.toString() || '18.0');
    setSupplier('');
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku);
    setPrice(p.price.toString());
    setCostPrice(p.cost_price.toString());
    setStockQuantity(p.stock_quantity.toString());
    setMinStockLevel(p.min_stock_level.toString());
    setTaxRate(p.tax_rate.toString());
    setSupplier(p.supplier || '');
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const priceNum = parseFloat(price);
    const costNum = parseFloat(costPrice || '0');
    const stockNum = parseInt(stockQuantity);
    const minStockNum = parseInt(minStockLevel);
    const taxNum = parseFloat(taxRate || '18');

    if (!name.trim() || !sku.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      setErrorMsg("Please provide valid Product Name, SKU, Price, and Stock Quantity.");
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: name.trim(),
          category: category.trim(),
          sku: sku.trim(),
          price: priceNum,
          cost_price: costNum,
          stock_quantity: stockNum,
          min_stock_level: minStockNum,
          tax_rate: taxNum,
          supplier: supplier.trim(),
        });
        setSuccessMsg(`Product '${name}' updated successfully!`);
      } else {
        await api.createProduct({
          name: name.trim(),
          category: category.trim(),
          sku: sku.trim(),
          price: priceNum,
          cost_price: costNum,
          stock_quantity: stockNum,
          min_stock_level: minStockNum,
          tax_rate: taxNum,
          supplier: supplier.trim(),
        });
        setSuccessMsg(`Product '${name}' added to catalog!`);
      }

      setShowModal(false);
      loadProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (productId: number, prodName: string) => {
    if (!window.confirm(`Are you sure you want to delete product '${prodName}'?`)) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      setSuccessMsg(`Product '${prodName}' deleted.`);
      loadProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Messages */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}
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
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage inventory items, pricing, tax rates, and SKU configurations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            Total Items: <strong className="text-slate-900 font-mono">{products.length}</strong>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-500 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-700"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock Quantity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-slate-600 cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Tax Rate</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
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
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currency}{p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {currency}{p.cost_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {p.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {p.tax_rate}%
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.supplier || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
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
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>{editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Ergonomic Mouse"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="Electronics, Accessories, etc."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="EL-MS-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="850.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase / Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="520.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="18"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Distributor</label>
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
