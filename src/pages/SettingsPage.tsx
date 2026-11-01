import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StoreSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, CheckCircle2, Store, Percent, Phone, Mail, MapPin } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'Apex Retail & Electronics',
    tagline: 'Quality Goods & Reliable Service',
    phone: '+91 98765 43210',
    email: 'support@apexretail.local',
    address: 'Shop 14, Commercial Plaza, M.G. Road',
    gst_tax_number: '27AABCA1234F1Z8',
    currency_symbol: '₹',
    default_tax_rate: 18.0,
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Administrator role required to edit settings.");
      return;
    }

    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSuccessMsg("Store and invoice settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Store Settings & Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business name, address, tax identification, and printed invoice headers.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        {/* Business Identity */}
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center space-x-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Store Profile & Brand</span>
          </h3>
          <p className="text-slate-500 text-[11px] mb-4">
            These values appear at the top of generated invoices and customer receipts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store / Business Name *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Slogan / Tagline</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Store Address</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Billing Currency */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center space-x-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Taxation & Currency Defaults</span>
          </h3>
          <p className="text-slate-500 text-[11px] mb-4">
            Setup default sales tax provisions and currency symbol for billing calculations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.gst_tax_number || ''}
                onChange={(e) => setSettings({ ...settings, gst_tax_number: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.currency_symbol || '₹'}
                onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                disabled={!isAdmin}
                value={settings.default_tax_rate}
                onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-2 transition cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Store Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
