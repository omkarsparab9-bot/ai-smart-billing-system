import React, { useState, useEffect } from 'react';
import { Product, Customer, StoreSettings, Invoice, CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CreditCard, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Building2,
  Calendar,
  Clock
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  // Billing state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 99999 99999');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState<string>('');

  // Search & Filters
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Customer modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerEmail, setNewCustomerEmail] = useState<string>('');

  // Generated Invoice Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [prods, custs, sets] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getSettings(),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setStoreSettings(sets);
    } catch (err: any) {
      console.error("Failed to load billing data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = storeSettings?.currency_symbol || '₹';

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setErrorMessage(`Cannot add '${product.name}' - Product is out of stock.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          setErrorMessage(`Cannot add more than available stock (${product.stock_quantity}) for '${product.name}'.`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unit_price: product.price,
            tax_rate: product.tax_rate,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_quantity) {
              setErrorMessage(`Maximum available stock is ${item.product.stock_quantity}.`);
              setTimeout(() => setErrorMessage(null), 3000);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setDiscountAmount(0);
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  // Recalculate discount
  const calculatedDiscount =
    discountType === 'percentage'
      ? Math.round((subtotal * (discountValue / 100)) * 100) / 100
      : Math.min(discountValue, subtotal);

  const totalTax = cart.reduce((sum, item) => {
    const itemSub = item.unit_price * item.quantity;
    return sum + (itemSub * (item.tax_rate / 100));
  }, 0);

  const grandTotal = Math.max(0, subtotal - calculatedDiscount + totalTax);

  // Customer selection
  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = parseInt(e.target.value);
    if (!custId || isNaN(custId)) {
      setSelectedCustomerId(null);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('+91 99999 99999');
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setSelectedCustomerId(found.id);
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) {
      alert('Please fill in Customer Name and Phone Number');
      return;
    }
    try {
      const res = await api.createCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
      });
      const updatedCusts = await api.getCustomers();
      setCustomers(updatedCusts);
      setSelectedCustomerId(res.customer_id || updatedCusts[updatedCusts.length - 1].id);
      setCustomerName(newCustomerName);
      setCustomerPhone(newCustomerPhone);
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setSuccessMessage('Customer added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  // Submit invoice
  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the cart before generating an invoice.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const invoicePayload = {
        customer_id: selectedCustomerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
        })),
        discount_amount: calculatedDiscount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes: notes.trim(),
      };

      const created = await api.createInvoice(invoicePayload);
      setCompletedInvoice(created);
      clearCart();
      // Reload products to reflect updated stock immediately
      loadData();
      setSuccessMessage(`Invoice ${created.invoice_number} created successfully! Stock updated.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Top Banner: Store & Current Billing Session info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">
              Point of Sale Billing Terminal
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{currentTime}</span>
              </span>
              <span>•</span>
              <span>Cashier: <strong className="text-slate-700">{user?.full_name || 'Staff'}</strong></span>
            </div>
          </div>
        </div>

        {/* Customer Selector & Quick Add */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Selected Customer:
            </span>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCustomerId || ''}
                onChange={handleSelectCustomer}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">Walk-in Customer (General Counter Sale)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                title="Add New Customer"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer border border-slate-200"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Customer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Billing Grid: 7 Cols Catalog, 5 Cols Cart/Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Selection Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Pills */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Category selection */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const inCart = cart.find((i) => i.product.id === prod.id);
              const isOutOfStock = prod.stock_quantity <= 0;
              const isLowStock = prod.stock_quantity <= prod.min_stock_level && !isOutOfStock;

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-xl border p-3.5 transition flex flex-col justify-between shadow-2xs ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50/70 opacity-60'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">
                          {prod.sku}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">
                          {prod.name}
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {prod.category}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {currency}{prod.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Tax: {prod.tax_rate}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          Stock: {prod.stock_quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    {inCart ? (
                      <div className="flex items-center space-x-2 w-full justify-between">
                        <span className="text-xs font-semibold text-blue-700">
                          {inCart.quantity} in bill
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => updateQuantity(prod.id, 1)}
                            disabled={inCart.quantity >= prod.stock_quantity}
                            className="p-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        disabled={isOutOfStock}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bill'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No products match your search criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Invoice Cart & Settlement (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden sticky top-20">
          {/* Cart Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Active Bill / Order</h3>
              <p className="text-[11px] text-slate-500">
                {cart.length} item{cart.length !== 1 ? 's' : ''} added
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-medium text-slate-500">Billing cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select items from the catalog on the left to start billing.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemSub = item.unit_price * item.quantity;
                const itemTax = itemSub * (item.tax_rate / 100);
                const itemTotal = itemSub + itemTax;

                return (
                  <div key={item.product.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currency}{item.unit_price.toFixed(2)} × {item.quantity} (Tax: {item.tax_rate}%)
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                        className="w-6 h-6 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total & Delete */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900 font-mono">
                        {currency}{itemTotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 mt-0.5 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Billing Calculations & Discounts */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
            {/* Discount input */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 font-medium">Discount:</span>
              <div className="flex items-center space-x-1">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-medium text-slate-700"
                >
                  <option value="flat">{currency} Flat</option>
                  <option value="percentage">% Percent</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue || ''}
                  placeholder="0"
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-right text-xs font-mono font-medium focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">{currency}{subtotal.toFixed(2)}</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono">- {currency}{calculatedDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Calculated Tax:</span>
                <span className="font-mono font-medium">{currency}{totalTax.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-lg text-blue-700 font-mono">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Payment Method:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                  { id: 'Bank Transfer', label: 'Bank', icon: Building2 },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        isSel
                          ? 'border-blue-600 bg-blue-50/70 text-blue-800 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Status (Paid / Pending) */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 font-medium text-[11px]">Payment Status:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pending')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    paymentStatus === 'Pending'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending / Credit
                </button>
              </div>
            </div>

            {/* Optional Notes */}
            <input
              type="text"
              placeholder="Optional remarks/notes on invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />

            {/* Action Submit Button */}
            <button
              onClick={handleGenerateInvoice}
              disabled={isSubmitting || cart.length === 0}
              className="w-full mt-2 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-700/20 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Recording Invoice & Updating Stock...' : `Generate & Save Invoice (${currency}${grandTotal.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New Customer Quick Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Register New Customer</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 12345"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@example.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immediate Invoice Receipt Modal with Print functionality */}
      <InvoiceModal
        invoice={completedInvoice}
        storeSettings={storeSettings || undefined}
        onClose={() => setCompletedInvoice(null)}
      />
    </div>
  );
};
