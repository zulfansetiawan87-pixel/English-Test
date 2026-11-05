/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, ShieldAlert, CheckCircle2, Copy, Check, Terminal, ExternalLink, X, Cpu } from 'lucide-react';

interface KioskDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KioskDocModal: React.FC<KioskDocModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'capacitor' | 'native_code' | 'device_owner'>('overview');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const CAPACITOR_CONFIG = `{
  "appId": "com.sekolah.secureexam",
  "appName": "SecureExam CBT",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "Keyboard": {
      "resize": "body",
      "style": "dark"
    }
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  }
}`;

  const MAIN_ACTIVITY_JAVA = `package com.sekolah.secureexam;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private DevicePolicyManager dpm;
    private ComponentName adminComponent;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. BLOKIR SCREENSHOT & SCREEN RECORDING (FLAG_SECURE)
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        // 2. CEGAH LAYAR MATI / SLEEP SELAMA UJIAN
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // 3. AKTIFKAN LOCK TASK MODE (KIOSK MODE) JIKA DEVICE OWNER
        dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminComponent = new ComponentName(this, AdminReceiver.class);

        if (dpm.isDeviceOwnerApp(getPackageName())) {
            // Set whitelist paket aplikasi ini diizinkan terkunci
            String[] packages = { getPackageName() };
            dpm.setLockTaskPackages(adminComponent, packages);
            
            // Kunci bilah notifikasi status bar, tombol home & back
            dpm.setStatusBarDisabled(adminComponent, true);
            dpm.setKeyguardDisabled(adminComponent, true);
            
            // Mulai Kiosk Mode tanpa dialog popup konfirmasi
            startLockTask();
        } else {
            // Fallback: Screen Pinning standar untuk perangkat non-Device Owner
            try {
                startLockTask();
            } catch (Exception e) {
                // Device belum diizinkan screen pinning
            }
        }
    }
}`;

  const DEVICE_OWNER_ADB = `# 1. Factory Reset atau Hapus semua akun Google di HP/Tablet siswa
# 2. Aktifkan USB Debugging di Developer Options
# 3. Sambungkan tablet ke PC pengawas dan jalankan perintah:

adb shell dpm set-device-owner com.sekolah.secureexam/.AdminReceiver

# 4. Verifikasi status Device Owner berhasil:
adb shell dumpsys device_policy | grep "Device Owner"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Arsitektur Kiosk Mode & Native Android APK
              </h2>
              <p className="text-xs text-slate-400">
                Panduan resmi implementasi proteksi anti-kecurangan 100% untuk Asesmen Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-2 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Batas Web vs Kiosk Native
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'capacitor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Konfigurasi Capacitor
          </button>
          <button
            onClick={() => setActiveTab('native_code')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'native_code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. MainActivity.java & FLAG_SECURE
          </button>
          <button
            onClick={() => setActiveTab('device_owner')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'device_owner'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Setup Device Owner (ADB)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block text-amber-300 font-semibold mb-1">
                    Prinsip Keamanan Siber: Batasan Lingkungan Web Browser
                  </strong>
                  Web browser (Chrome/Edge/Safari) berjalan di dalam sandbox pengguna. Browser <strong>TIDAK BISA</strong> secara mutlak memblokir tombol fisik screenshot (Power + Vol Down), split-screen bawaan OS produsen (Xiaomi/Oppo/Samsung), atau gesture usap layar jika sistem operasi mengizinkannya.
                  <br />
                  Untuk pelaksanaan ujian sekolah berkekuatan hukum dan anti-bocor tingkat tinggi, disarankan mem-build aplikasi ini menjadi <strong>Android APK dengan Kiosk Mode (Lock Task)</strong>.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Lapisan 1: PWA Web Browser (Bawaan)
                  </h4>
                  <ul className="text-xs space-y-1.5 text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Fullscreen API & kunci orientasi
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Deteksi visibility & jendela blur (catat curang)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Blokir klik kanan, copy, cut, paste, & F12
                    </li>
                    <li className="flex items-center gap-1.5 text-rose-300">
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      Tidak bisa memblokir split-screen Android tertentu
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-600/30">
                  <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Lapisan 2: APK Kiosk Native (Capacitor)
                  </h4>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>FLAG_SECURE:</strong> Tangkapan layar hitam/dilarang
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>LockTaskMode:</strong> Tombol Home & Recent terkunci
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>Status Bar Lock:</strong> Siswa tak bisa menarik notifikasi
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>Device Owner:</strong> Aplikasi tak bisa ditutup paksa
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Jalankan perintah berikut di terminal proyek Anda untuk membungkus React Vite ke Android Studio:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
                npm install @capacitor/core @capacitor/cli @capacitor/android<br />
                npx cap init "SecureExam CBT" "com.sekolah.secureexam"<br />
                npm run build<br />
                npx cap add android<br />
                npx cap copy android
              </div>

              <div className="relative">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>File: capacitor.config.json</span>
                  <button
                    onClick={() => copyToClipboard(CAPACITOR_CONFIG, 1)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 1 ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  {CAPACITOR_CONFIG}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'native_code' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Buka folder <code>android/app/src/main/java/.../MainActivity.java</code> dan sisipkan kode native Lock Task Mode berikut:
              </p>
              <div className="relative">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>MainActivity.java (FLAG_SECURE & LockTask)</span>
                  <button
                    onClick={() => copyToClipboard(MAIN_ACTIVITY_JAVA, 2)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 2 ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-72">
                  {MAIN_ACTIVITY_JAVA}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'device_owner' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Untuk tablet/perangkat inventaris laboratorium sekolah, gunakan mode <strong>Device Owner</strong> via kabel data ADB. Ini memberi kendali penuh sehingga siswa tidak dapat keluar dari aplikasi ujian sama sekali tanpa PIN guru:
              </p>
              <div className="relative">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Perintah Terminal ADB (Command Prompt / Bash)</span>
                  <button
                    onClick={() => copyToClipboard(DEVICE_OWNER_ADB, 3)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {copiedIndex === 3 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 3 ? 'Tersalin' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto">
                  {DEVICE_OWNER_ADB}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            Tutup Dokumentasi
          </button>
        </div>
      </div>
    </div>
  );
};
