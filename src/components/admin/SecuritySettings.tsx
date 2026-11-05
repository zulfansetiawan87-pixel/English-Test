/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db, SupabaseConfig } from '../../services/db';
import { cloudSync } from '../../services/cloudSync';
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
  Lock,
  Cloud,
  RefreshCw,
  Download,
  Upload
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
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const handleForcePushToCloud = async () => {
    setIsCloudLoading(true);
    setCloudMessage('Mengunggah seluruh data kuis & soal ke cloud server...');
    const ok = await cloudSync.pushFullState({
      quizzes: db.getQuizzes(),
      questionBank: db.getQuestionBank(),
      teachers: db.getTeachers(),
      sessions: db.getSessions(),
    });
    setIsCloudLoading(false);
    if (ok) {
      setCloudMessage('✅ Seluruh data kuis & soal berhasil diunggah dan tersimpan online!');
    } else {
      setCloudMessage('⚠️ Gagal mengunggah ke cloud server. Periksa koneksi internet.');
    }
    setTimeout(() => setCloudMessage(null), 4000);
  };

  const handleForcePullFromCloud = async () => {
    setIsCloudLoading(true);
    setCloudMessage('Mengambil data terbaru dari cloud server...');
    const ok = await cloudSync.pullFromCloud();
    setIsCloudLoading(false);
    if (ok) {
      onDataReset();
      setCloudMessage('✅ Data terbaru dari cloud server berhasil disinkronkan ke perangkat ini!');
    } else {
      setCloudMessage('⚠️ Tidak dapat mengambil data dari cloud server.');
    }
    setTimeout(() => setCloudMessage(null), 4000);
  };

  const handleDownloadBackup = () => {
    const data = {
      quizzes: db.getQuizzes(),
      questionBank: db.getQuestionBank(),
      teachers: db.getTeachers(),
      sessions: db.getSessions(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_cbt_secureexam_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.quizzes) {
          db.mergeCloudData(parsed);
          await cloudSync.pushFullState({
            quizzes: db.getQuizzes(),
            questionBank: db.getQuestionBank(),
            teachers: db.getTeachers(),
            sessions: db.getSessions(),
          });
          onDataReset();
          alert('Data backup berhasil di-restore dan disinkronkan ke cloud!');
        } else {
          alert('Format file backup JSON tidak valid.');
        }
      } catch (err: any) {
        alert('Gagal membaca file backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

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

      {/* Cloud Server Synchronization & Multi-Device Card */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl shadow-blue-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Sinkronisasi Cloud Server Otomatis (Multi-Device)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  Online Active
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Semua butir soal, kuis, akun guru, dan kunci jawaban yang dibuat otomatis tersimpan di cloud server dan dapat diakses dari perangkat mana pun secara langsung.
              </p>
            </div>
          </div>
        </div>

        {cloudMessage && (
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-700/60 text-blue-200 text-xs font-medium">
            {cloudMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
          <button
            type="button"
            onClick={handleForcePullFromCloud}
            disabled={isCloudLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isCloudLoading ? 'animate-spin' : ''}`} />
            <span>Tarik Data Cloud (Pull)</span>
          </button>

          <button
            type="button"
            onClick={handleForcePushToCloud}
            disabled={isCloudLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Unggah ke Cloud (Push)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download Backup JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition active:scale-95 cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restore Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>
        </div>
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
