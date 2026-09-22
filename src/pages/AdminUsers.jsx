import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/client';

const ROLE_LABELS = {
  admin: { title: 'Owner', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  inventory: { title: 'Inventory', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  checker: { title: 'Checker', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  staff: { title: 'Kasir', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Role State
  const [editingUserId, setEditingUserId] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/auth/users', { auth: 'admin' });
      if (res.success) {
        setUsers(res.data || []);
      } else {
        setError(res.error || 'Gagal memuat daftar pengguna internal');
      }
    } catch {
      setError('Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await api.post('/api/auth/users', {
        email: formEmail,
        password: formPassword,
        full_name: formName,
        role: formRole,
        phone: formPhone || undefined
      }, { auth: 'admin' });

      if (res.success) {
        setSuccessMsg(`Pengguna "${formName}" berhasil ditambahkan sebagai ${ROLE_LABELS[formRole]?.title || formRole}!`);
        setShowAddModal(false);
        setFormEmail('');
        setFormName('');
        setFormPhone('');
        setFormPassword('');
        setFormRole('staff');
        fetchUsers();
      } else {
        setFormError(res.error || 'Gagal membuat pengguna baru');
      }
    } catch {
      setFormError('Koneksi bermasalah saat membuat pengguna');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(true);
    setError('');
    try {
      const res = await api.put(`/api/auth/users/${userId}/role`, { role: newRole }, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg('Role pengguna berhasil diperbarui!');
        setEditingUserId(null);
        fetchUsers();
      } else {
        setError(res.error || 'Gagal mengubah role');
      }
    } catch {
      setError('Koneksi bermasalah saat memperbarui role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterRole === 'all') return true;
    return u.role === filterRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2.5">
            <Users className="text-brand-blue" size={26} />
            <span>Tim</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Kelola akun dan hak akses tim.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setShowAddModal(true); setFormError(''); }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <UserPlus size={16} />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-1">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            filterRole === 'all'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'bg-white text-text-secondary border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Semua ({users.length})
        </button>
        {Object.entries(ROLE_LABELS).map(([key, meta]) => {
          const count = users.filter(u => u.role === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterRole === key
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-white text-text-secondary border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {meta.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-brand-blue" />
            <span>Memuat data tim...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-xs">
            Tidak ada anggota tim dengan peran ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-text-secondary font-semibold">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const roleMeta = ROLE_LABELS[user.role] || { title: user.role, badge: 'bg-gray-100 text-gray-700' };
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs uppercase">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                          <span>{user.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div>{user.email}</div>
                        {user.phone && <div className="text-[11px] text-gray-600 mt-0.5">{user.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              defaultValue={user.role}
                              id={`select-role-${user.id}`}
                              disabled={updatingRole}
                              className="text-xs px-2 py-1 rounded-lg border border-brand-blue bg-white focus:outline-none"
                            >
                              <option value="admin">Owner</option>
                              <option value="inventory">Inventory</option>
                              <option value="checker">Checker</option>
                              <option value="staff">Kasir</option>
                            </select>
                            <button
                              onClick={() => {
                                const sel = document.getElementById(`select-role-${user.id}`);
                                if (sel) handleRoleChange(user.id, sel.value);
                              }}
                              disabled={updatingRole}
                              className="px-2 py-1 bg-brand-blue text-white rounded-md text-[11px] font-semibold"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 bg-gray-100 text-text-secondary rounded-md text-[11px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${roleMeta.badge}`}>
                            {roleMeta.title}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isEditing && (
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="text-xs text-brand-blue hover:underline font-semibold"
                          >
                            Ubah Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-primary font-heading flex items-center gap-2">
                <UserPlus size={18} className="text-brand-blue" />
                <span>Tambah Anggota Baru</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-body">
              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Email Login *
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@dimsum.id"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Nomor WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Peran *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none font-semibold text-xs"
                >
                  <option value="inventory">Inventory (Rencana produksi & stok)</option>
                  <option value="checker">Checker (Verifikasi fisik & cetak label)</option>
                  <option value="staff">Kasir (Scan pengambilan & pickup)</option>
                  <option value="admin">Owner (Akses penuh)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-primary font-semibold mb-1">
                  Kata Sandi Sementara *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
