import React from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  FileText, 
  Package, 
  Users, 
  Boxes, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Settings, 
  UserCheck, 
  LogOut,
  ShoppingBag,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 
  | 'dashboard' 
  | 'billing' 
  | 'invoices' 
  | 'products' 
  | 'customers' 
  | 'inventory' 
  | 'sales' 
  | 'reports' 
  | 'ai-assistant' 
  | 'staff' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing' as NavTab, label: 'New Bill / POS', icon: ReceiptText, badge: 'Core' },
    { id: 'invoices' as NavTab, label: 'Invoices', icon: FileText },
    { id: 'products' as NavTab, label: 'Products', icon: Package },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
    { id: 'inventory' as NavTab, label: 'Inventory', icon: Boxes },
    { id: 'sales' as NavTab, label: 'Sales Records', icon: TrendingUp },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'ai-assistant' as NavTab, label: 'AI Assistant', icon: Sparkles, badge: 'Gemini' },
  ];

  // Admin exclusive tabs
  const adminItems = [
    { id: 'staff' as NavTab, label: 'Staff Management', icon: UserCheck },
    { id: 'settings' as NavTab, label: 'Store Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white tracking-tight leading-tight text-sm">
            Smart Billing System
          </div>
          <div className="text-[11px] text-blue-400 font-medium">
            AI Sales & POS Suite
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Store Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : item.badge === 'Core'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {role === 'admin' && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">
              Administration
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* User profile & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              role === 'admin' ? 'bg-amber-600 text-amber-50' : 'bg-blue-600 text-blue-50'
            }`}>
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {user?.full_name || user?.username || 'Staff Member'}
              </div>
              <div className="flex items-center space-x-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  role === 'admin' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <span className="text-[10px] text-slate-400 capitalize">
                  {role === 'admin' ? 'Shop Admin' : 'Billing Staff'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
