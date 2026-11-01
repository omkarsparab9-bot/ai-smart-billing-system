import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { BillingPage } from './pages/BillingPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { StaffPage } from './pages/StaffPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading AI Smart Billing and Sales System...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Role based access security guard
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'billing':
        return <BillingPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'products':
        return <ProductsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'staff':
        return role === 'admin' ? <StaffPage /> : <Dashboard onNavigate={setCurrentTab} />;
      case 'settings':
        return role === 'admin' ? <SettingsPage /> : <Dashboard onNavigate={setCurrentTab} />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
