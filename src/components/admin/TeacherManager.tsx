/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TeacherAccount } from '../../types';
import { db } from '../../services/db';
import {
  fetchTeachersList,
  addTeacherWithSupabase,
  deleteTeacherWithSupabase,
  getSupabaseClient,
} from '../../services/supabaseClient';
import {
  UserPlus,
  Search,
  Key,
  Shield,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Mail,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Server,
  Lock
} from 'lucide-react';

interface TeacherManagerProps {
  onRefresh: () => void;
}

export const TeacherManager: React.FC<TeacherManagerProps> = ({ onRefresh }) => {
  const [teachers, setTeachers] = useState<TeacherAccount[]>(db.getTeachers());
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formRole, setFormRole] = useState<'guru' | 'super_admin'>('guru');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Load teachers from Supabase on mount
  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTeachersList();
      setTeachers(res.teachers);
      setDataSource(res.source);
    } catch (e) {
      console.warn('Gagal memuat guru:', e);
      setTeachers(db.getTeachers());
      setDataSource('local');
    } finally {
      setIsLoading(false);
      onRefresh();
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormSubject('Informatika');
    setFormRole('guru');
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherAccount) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormPassword(t.password);
    setFormSubject(t.subject || '');
    setFormRole(t.role);
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(res);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Nama lengkap guru wajib diisi.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Format email tidak valid.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.');
      return;
    }

    // Check duplicate email
    const duplicate = teachers.find(
      t => t.email.toLowerCase() === formEmail.trim().toLowerCase() &&
           (!editingTeacher || t.id !== editingTeacher.id)
    );
    if (duplicate) {
      setFormError('Email sudah terdaftar untuk guru lain.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTeacher) {
        // Edit existing teacher
        const updated: TeacherAccount = {
          ...editingTeacher,
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          subject: formSubject.trim() || 'Umum',
          role: formRole,
        };
        db.saveTeacher(updated);

        // Also update in Supabase if connected
        const client = getSupabaseClient();
        if (client) {
          await client
            .from('teachers')
            .update({
              name: formName.trim(),
              password_hint: formPassword.trim(),
              subject: formSubject.trim() || 'Umum',
              role: formRole,
              updated_at: new Date().toISOString(),
            })
            .eq('email', formEmail.trim());
        }

        setNotification({
          type: 'success',
          message: `Akun guru "${formName}" berhasil diperbarui.`,
        });
      } else {
        // Add new teacher with Supabase Auth & 'teachers' table
        const res = await addTeacherWithSupabase({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          subject: formSubject.trim() || 'Umum',
          role: formRole,
        });

        setNotification({
          type: 'success',
          message: res.message,
        });
      }

      setIsModalOpen(false);
      await loadTeachers();
    } catch (err: any) {
      setFormError('Gagal menyimpan: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async (t: TeacherAccount) => {
    if (t.email.toLowerCase() === 'admin@eskasaba.id') {
      alert('Akun Administrator Utama (Admin@eskasaba.id) tidak dapat dihapus.');
      return;
    }

    if (confirm(`Hapus akun guru "${t.name}" (${t.email})? Guru ini tidak akan dapat login lagi.`)) {
      setIsLoading(true);
      const res = await deleteTeacherWithSupabase(t);
      setNotification({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      await loadTeachers();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCredentials = (t: TeacherAccount) => {
    const text = `Kredensial Login CBT Eskasaba:\nEmail: ${t.email}\nPassword: ${t.password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SQL_TEACHER_SCHEMA = `-- Tabel Khusus 'teachers' & RLS di Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID,                                 -- Terhubung ke auth.users(id) Supabase
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hint VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'guru' CHECK (role IN ('super_admin', 'guru')),
    subject VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aturan RLS Keamanan
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to teachers" ON public.teachers
    FOR ALL USING (true);`;

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Teacher Management (Manajemen Akun Guru)
            </h3>
            {dataSource === 'supabase' ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium">
                <Database className="w-3 h-3 text-emerald-400" />
                Supabase Auth & Table 'teachers'
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">
                <Database className="w-3 h-3 text-blue-400" />
                Penyimpanan Lokal Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola data kredensial guru (email/password) terintegrasi dengan Supabase Auth & tabel <code>teachers</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari guru atau email..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={loadTeachers}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Data Guru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700 text-xs font-medium transition"
            title="Lihat skema SQL tabel teachers Supabase"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Skema SQL</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-900/40 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Guru</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-md transition ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teachers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Guru / Admin</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredTeachers.map(t => {
                const isPrimaryAdmin = t.email.toLowerCase() === 'admin@eskasaba.id';
                const isPasswordVisible = visiblePasswords[t.id];

                return (
                  <tr key={t.id} className="hover:bg-slate-850/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            t.role === 'super_admin'
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {isPrimaryAdmin && (
                              <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                Utama
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Terdaftar: {new Date(t.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {t.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {isPasswordVisible ? t.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(t.id)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                          title={isPasswordVisible ? 'Sembunyikan Password' : 'Lihat Password'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyCredentials(t)}
                          className="p-1 text-slate-500 hover:text-blue-400"
                          title="Salin Email & Password"
                        >
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {t.subject || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          t.role === 'super_admin'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.role === 'super_admin' ? 'Super Admin' : 'Guru Penguji'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Akun Guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Hapus Akun Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                {editingTeacher ? 'Ubah Data Akun Guru' : 'Tambah Akun Guru (Supabase Auth)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Guru */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Nama Lengkap & Gelar Guru
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Dra. Nur Azizah, M.Pd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Alamat Email (Digunakan untuk Login)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama.guru@eskasaba.id"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 block">
                    Kata Sandi (Password)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Acak Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-2"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mata Pelajaran & Peran */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Bahasa Indonesia"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Hak Akses / Peran
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="guru">Guru Penguji</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <span>Simpan Akun Guru</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Skema SQL Supabase 'teachers' */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                Skema SQL Tabel 'teachers' Supabase
              </h3>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-xs">
              Jalankan query DDL berikut di <strong>Supabase SQL Editor</strong> untuk membuat tabel <code>teachers</code> dan mengaktifkan Row Level Security (RLS):
            </p>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56">
              {SQL_TEACHER_SCHEMA}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SQL_TEACHER_SCHEMA);
                  alert('Skema SQL tabel teachers berhasil disalin!');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
              >
                Salin Query SQL
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
