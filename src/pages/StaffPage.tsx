import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserPlus, Trash2, Shield, User as UserIcon, CheckCircle2, Lock } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add User Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('staff');
  const [phone, setPhone] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err: any) {
      setErrorMsg("Failed to load staff accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await api.createUser({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        role,
        phone: phone.trim(),
      });
      setSuccessMsg(`User '${username}' created successfully!`);
      setShowModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setPhone('');
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert("You cannot delete your own logged-in account.");
      return;
    }
    if (!window.confirm(`Delete user account '${u.username}'?`)) return;

    try {
      await api.deleteUser(u.id);
      setSuccessMsg(`User '${u.username}' deleted.`);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
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
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Staff & Operator Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authorization between Shop Owners (Administrators) and Billing Staff.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-amber-700 font-bold mb-2">
            <Shield className="w-4 h-4" />
            <span>Shop Owner / Administrator</span>
          </div>
          <p className="text-slate-600 mb-2">
            Full administrative control: add & delete products, adjust inventory, view business reports, change store settings, manage staff accounts, and run AI assistant queries.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">Default credentials: admin / admin123</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-blue-700 font-bold mb-2">
            <UserIcon className="w-4 h-4" />
            <span>Billing Staff / Cashier</span>
          </div>
          <p className="text-slate-600 mb-2">
            Point-of-Sale billing operations: search catalog, add items to cart, register customers, apply discounts, generate and print tax invoices, and view billing history.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">Default credentials: staff / staff123</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{u.full_name}</td>
                  <td className="py-3 px-4 font-mono text-blue-600 font-medium">@{u.username}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role === 'admin' ? 'Administrator' : 'Billing Staff'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.created_at}</td>
                  <td className="py-3 px-4 text-center">
                    {u.id !== currentUser?.id ? (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Current Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Create Staff Account</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul_billing"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="staff">Billing Staff (POS billing, receipts, customer register)</option>
                  <option value="admin">Administrator (Complete access & settings)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
