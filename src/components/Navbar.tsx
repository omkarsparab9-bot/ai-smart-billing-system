import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, PlusCircle, CheckCircle2, Server, User as UserIcon } from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, backendConnected, checkBackendHealth } = useAuth();
  const [checking, setChecking] = React.useState(false);

  const handleRefreshHealth = async () => {
    setChecking(true);
    await checkBackendHealth();
    setTimeout(() => setChecking(false), 500);
  };

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Store Overview & Dashboard';
      case 'billing': return 'Point of Sale & Smart Billing';
      case 'invoices': return 'Invoice Archive & Receipts';
      case 'products': return 'Product Catalog Management';
      case 'customers': return 'Customer Records & History';
      case 'inventory': return 'Stock Inventory & Restocking';
      case 'sales': return 'Sales Transactions';
      case 'reports': return 'Business Sales Reports';
      case 'ai-assistant': return 'Google Gemini AI Business Assistant';
      case 'staff': return 'Staff & Operator Management';
      case 'settings': return 'Store Settings & Tax Config';
      default: return 'AI Smart Billing System';
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Context */}
      <div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          {getTabTitle(currentTab)}
        </h2>
        <p className="text-xs text-slate-500">
          Small Business Billing, Sales & Inventory Automation
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Backend Connectivity Status Pill */}
        <div
          title={
            backendConnected
              ? "FastAPI server running on http://127.0.0.1:8000 with SQLite smart_billing.db"
              : "Running in Web Standalone mode with seeded SQLite database. Run 'py -m uvicorn backend.app:app --reload --port 8000' to link Python backend."
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            backendConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <span>
            {backendConnected ? 'FastAPI + SQLite Active' : 'Standalone / SQLite Engine'}
          </span>
          <button
            onClick={handleRefreshHealth}
            disabled={checking}
            title="Check FastAPI backend on port 8000"
            className="p-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick New Bill Action */}
        {currentTab !== 'billing' && (
          <button
            onClick={() => onSelectTab('billing')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </button>
        )}

        {/* User Role Tag */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {user?.username || 'user'}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {role === 'admin' ? 'Administrator' : 'Staff'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
