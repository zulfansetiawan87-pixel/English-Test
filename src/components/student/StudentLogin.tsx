/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Quiz, StudentSession } from '../../types';
import { db } from '../../services/db';
import { cloudSync } from '../../services/cloudSync';
import { PWAInstallButton } from '../PWAInstallButton';
import {
  Shield,
  BookOpen,
  Clock,
  Key,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Info,
  Play,
  ArrowRight
} from 'lucide-react';

interface StudentLoginProps {
  onStartExam: (quiz: Quiz, session: StudentSession) => void;
  onSwitchToAdmin: () => void;
  onOpenKioskDoc: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  onStartExam,
  onSwitchToAdmin,
  onOpenKioskDoc,
}) => {
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [tokenInput, setTokenInput] = useState('');
  const [pledgeChecked, setPledgeChecked] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => db.getQuizzes().filter(q => q.status === 'active'));

  useEffect(() => {
    const unsub = cloudSync.subscribeDataChange(() => {
      setQuizzes(db.getQuizzes().filter(q => q.status === 'active'));
    });
    cloudSync.pullFromCloud().then(() => {
      setQuizzes(db.getQuizzes().filter(q => q.status === 'active'));
    });
    return () => unsub();
  }, []);

  // Ambil daftar kelas secara dinamis dari kuis aktif
  const classList = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach(q => {
      q.targetClasses.forEach(c => {
        if (c && c !== 'Semua Kelas') set.add(c);
      });
    });
    if (set.size === 0) {
      ['X RPL 1', 'X RPL 2', 'XI TKJ 1', 'XII AKL 1'].forEach(c => set.add(c));
    }
    return Array.from(set);
  }, [quizzes]);

  const effectiveClass = selectedClass === 'Lainnya' ? customClass : selectedClass;

  // Filter quizzes targeted for this class or "Semua Kelas"
  const availableQuizzes = useMemo(() => {
    if (!effectiveClass) {
      return [];
    }
    return quizzes.filter(q => {
      if (q.targetClasses.includes('Semua Kelas')) return true;
      if (q.targetClasses.includes(effectiveClass)) return true;
      return false;
    });
  }, [quizzes, effectiveClass]);

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Quick autofill demo student for testing
  const autofillDemo = (demoNis: string, demoName: string, demoClass: string) => {
    setNis(demoNis);
    setName(demoName);
    setSelectedClass(demoClass);
    if (quizzes.length > 0) {
      setSelectedQuizId(quizzes[0].id);
      if (quizzes[0].token) {
        setTokenInput(quizzes[0].token);
      }
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Harap masukkan Nama Lengkap Anda.');
      return;
    }
    if (!nis.trim()) {
      setErrorMsg('Harap masukkan Nomor Induk Siswa (NIS).');
      return;
    }
    if (!effectiveClass.trim()) {
      setErrorMsg('Harap tentukan Kelas Anda.');
      return;
    }
    if (!selectedQuiz) {
      setErrorMsg('Harap pilih salah satu Ujian / Kuis dari daftar.');
      return;
    }

    // Verify Token if required
    if (selectedQuiz.token && selectedQuiz.token.trim().length > 0) {
      if (tokenInput.trim().toUpperCase() !== selectedQuiz.token.trim().toUpperCase()) {
        setErrorMsg(`Token ujian salah! Hubungi guru pengawas untuk mendapatkan token.`);
        return;
      }
    }

    if (!pledgeChecked) {
      setErrorMsg('Anda wajib menyetujui Pakta Kejujuran dan Integritas Ujian.');
      return;
    }

    // Check if session already exists (Session Recovery)
    const existingSession = db.findActiveSession(selectedQuiz.id, nis);
    if (existingSession) {
      if (existingSession.status === 'submitted') {
        setErrorMsg('Anda sudah mengumpulkan ujian ini. Tidak dapat mengulang kembali.');
        return;
      }
      if (existingSession.status === 'locked_violation') {
        setErrorMsg('Sesi ujian Anda terkunci karena pelanggaran. Harap melapor ke Guru Pengawas untuk membuka kunci.');
        return;
      }
      // Resume session
      onStartExam(selectedQuiz, existingSession);
      return;
    }

    // Create New Session
    const now = new Date();
    const duration = selectedQuiz.durationMinutes || 45;
    const expires = new Date(now.getTime() + duration * 60000);

    const newSession: StudentSession = {
      id: 'session-' + Date.now(),
      quizId: selectedQuiz.id,
      quizTitle: selectedQuiz.title,
      subject: selectedQuiz.subject,
      studentName: name.trim(),
      studentNis: nis.trim(),
      studentClass: effectiveClass.trim(),
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'in_progress',
      answers: {},
      isDoubtful: {},
      violations: [],
      totalScore: 0,
      maxScore: selectedQuiz.questions.reduce((acc, q) => acc + q.points, 0),
      isFullyGraded: false,
    };

    db.saveSession(newSession);
    onStartExam(selectedQuiz, newSession);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Header with App Branding & Switch to Teacher Login */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50 border border-blue-400/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
              SecureExam CBT
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Portal Siswa
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Sistem Asesmen & Ujian Online Berintegritas Tinggi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={onOpenKioskDoc}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-400" />
            <span>Kiosk Mode APK</span>
          </button>
          <button
            onClick={onSwitchToAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Masuk Guru / Admin
          </button>
        </div>
      </header>

      {/* Main Content: Mobile-First Student Login Form */}
      <main className="max-w-md w-full mx-auto my-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold font-heading text-white">
              Masuk Lembar Ujian
            </h2>
            <p className="text-xs text-slate-400">
              Isikan identitas resmi Anda sesuai data peserta sekolah.
            </p>
          </div>

          {/* Quick Demo Pre-fill for Tester */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Uji Coba Cepat (Autofill Data Siswa):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => autofillDemo('102405', 'Bima Satria', 'X RPL 1')}
                className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-700 text-[11px] text-blue-300 transition"
              >
                + Bima (X RPL 1)
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('102406', 'Dina Mariana', 'XI TKJ 1')}
                className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-700 text-[11px] text-blue-300 transition"
              >
                + Dina (XI TKJ 1)
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bima Satria"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* NIS & Kelas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  NIS (No. Induk)
                </label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="102405"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Kelas
                </label>
                <select
                  required
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedQuizId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Lainnya">Lainnya (Ketik Manual)...</option>
                </select>
              </div>
            </div>

            {selectedClass === 'Lainnya' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Ketik Nama Kelas
                </label>
                <input
                  type="text"
                  required
                  value={customClass}
                  onChange={(e) => {
                    setCustomClass(e.target.value);
                    setSelectedQuizId('');
                  }}
                  placeholder="Contoh: XII MM 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>
            )}

            {/* Pilih Kuis / Ujian */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Ujian / Kuis Aktif
              </label>
              {!effectiveClass ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Silakan pilih kelas Anda di atas untuk menampilkan daftar ujian yang sesuai.</span>
                </div>
              ) : availableQuizzes.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  Tidak ada ujian aktif untuk kelas {effectiveClass}. Silakan hubungi proktor.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableQuizzes.map(q => {
                    const isSelected = selectedQuizId === q.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuizId(q.id);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition text-left select-none ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-0.5">
                          <span>{q.subject}</span>
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                            <Clock className="w-3 h-3" />
                            {q.durationMinutes} Menit
                          </span>
                        </div>
                        <div className="text-sm font-semibold">{q.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{q.questions.length} Butir Soal</span>
                          {q.token && (
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">
                              Perlu Token
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Token Ujian (if quiz needs token) */}
            {selectedQuiz?.token && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Token Ujian
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Dapatkan dari pengawas di papan tulis
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan 6 digit token..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
              </div>
            )}

            {/* Pakta Integritas Kejujuran */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={pledgeChecked}
                  onChange={(e) => setPledgeChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="leading-relaxed">
                  <strong>Pakta Kejujuran:</strong> Saya bersedia mengerjakan ujian secara mandiri, mengizinkan sistem mengunci layar penuh (Fullscreen), dan menerima sanksi pembatalan nilai jika terbukti curang (berpindah tab / split screen).
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Mulai Pengerjaan Ujian</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3">
        SecureExam CBT v2.4 • Dirancang Khusus untuk Kelancaran Asesmen Sumatif & PAS Sekolah
      </footer>
    </div>
  );
};
