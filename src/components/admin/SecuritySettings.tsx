/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db, SupabaseConfig } from '../../services/db';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabaseSchema';
import {
  ShieldCheck,
  Database,
  Copy,
  Check,
  Server,
  Key,
  RotateCcw,
  Smartphone,
  ExternalLink,
  Lock
} from 'lucide-react';

interface SecuritySettingsProps {
  onOpenKioskDoc: () => void;
  onDataReset: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onOpenKioskDoc,
  onDataReset,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(db.getSupabaseConfig());
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSupabaseConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.anonKey) {
      setTestResult('Harap masukkan URL dan Anon Key terlebih dahulu.');
      return;
    }
    setTestResult('Memeriksa endpoint Supabase...');
    try {
      const res = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      });
      if (res.ok || res.status === 404 || res.status === 200) {
        setTestResult('✅ Terhubung sukses ke instance Supabase PostgreSQL!');
      } else {
        setTestResult(`⚠️ Gagal terhubung (Status: ${res.status}). Periksa URL & Key.`);
      }
    } catch (e: any) {
      setTestResult('⚠️ Endpoint tidak dapat dijangkau: ' + e.message);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleReset = () => {
    if (confirm('PERINGATAN: Seluruh data lokal kuis dan sesi siswa akan di-reset ke data bawaan demo?')) {
      db.resetAllData();
      onDataReset();
      alert('Data kuis dan peserta berhasil di-reset!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Kiosk Mode CTA Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-blue-950/40 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 mt-0.5">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-heading">
              Arsitektur Kiosk Mode & Native Android APK
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Web browser memiliki batasan sandboxing. Untuk proteksi mutlak terhadap screenshot fisik, split-screen OEM, dan tombol navigasi di perangkat siswa, gunakan konfigurasi Capacitor Native Lock Task Mode & Device Owner.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenKioskDoc}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 flex items-center gap-2 transition active:scale-95 flex-shrink-0"
        >
          <span>Buka Panduan Kiosk & APK</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Supabase Connection Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Konfigurasi Supabase PostgreSQL & Auth
              </h4>
              <p className="text-xs text-slate-400">
                Hubungkan ke database PostgreSQL cloud untuk sinkronisasi multi-ruangan ujian.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {config.isEnabled ? 'Supabase Aktif' : 'Penyimpanan Lokal Aktif (Offline Ready)'}
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
              >
                Uji Koneksi
              </button>
              {testResult && (
                <span className="text-[11px] text-slate-300">{testResult}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-emerald-400 font-medium text-xs">
                  ✓ Konfigurasi disimpan!
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Supabase Schema & RLS SQL Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Skema DDL PostgreSQL & Aturan Row Level Security (RLS)
            </h4>
            <p className="text-xs text-slate-400">
              Salin kode SQL ini ke Supabase SQL Editor untuk membuat tabel quizzes, questions, student_sessions, dan violations secara otomatis.
            </p>
          </div>

          <button
            onClick={copySqlToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
          {SUPABASE_SQL_SCHEMA}
        </pre>
      </div>

      {/* Reset Database Button */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-rose-300 block">
            Reset Data Uji Coba (Factory Reset)
          </span>
          <span className="text-[11px] text-slate-400">
            Mengembalikan seluruh kuis, bank soal, dan sesi simulasi ke kondisi bawaan instalasi awal.
          </span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Semua Data</span>
        </button>
      </div>
    </div>
  );
};
