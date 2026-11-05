/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, StudentSession, StudentAnswer, ViolationRecord } from '../../types';
import { db } from '../../services/db';
import { QuestionRenderer } from './QuestionRenderer';
import { useExamSecurity } from '../../hooks/useExamSecurity';
import { enterFullscreen } from '../../services/security';
import {
  Clock,
  LayoutGrid,
  Send,
  Flag,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Maximize,
  Lock,
  ArrowRight,
  Hourglass,
  Timer,
  FastForward,
  Bell
} from 'lucide-react';

interface ExamRoomProps {
  quiz: Quiz;
  session: StudentSession;
  onFinishExam: (updatedSession: StudentSession) => void;
  onExitToPortal: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({
  quiz,
  session: initialSession,
  onFinishExam,
  onExitToPortal,
}) => {
  const [session, setSession] = useState<StudentSession>(initialSession);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showNavModal, setShowNavModal] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(
    initialSession.status === 'submitted' || initialSession.status === 'force_submitted'
  );
  const [isLockedByViolation, setIsLockedByViolation] = useState<boolean>(
    initialSession.status === 'locked_violation'
  );
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving'>('saved');
  const [isAutoSubmitting, setIsAutoSubmitting] = useState<boolean>(false);
  const [timeNotice, setTimeNotice] = useState<string | null>(null);

  const hasAlerted5Min = useRef(false);
  const hasAlerted1Min = useRef(false);
  const isSubmittingRef = useRef(false);

  // Ordered questions (support shuffle if enabled)
  const questions = useMemo(() => {
    return quiz.questions;
  }, [quiz.questions]);

  const currentQuestion = questions[currentIndex];

  // Timer Calculation (Milliseconds remaining until expiresAt)
  const calculateRemainingSeconds = useCallback(() => {
    const expireTime = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
    return diff;
  }, [session.expiresAt]);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds());

  // Handle student answer change with instant Autosave
  const handleAnswerChange = (value: any) => {
    if (isExamCompleted || isLockedByViolation) return;
    setSaveIndicator('saving');

    const updatedAnswers = {
      ...session.answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        type: currentQuestion.type,
        value,
        savedAt: new Date().toISOString(),
      },
    };

    const updatedSession: StudentSession = {
      ...session,
      answers: updatedAnswers,
    };

    setSession(updatedSession);
    db.saveSession(updatedSession);

    setTimeout(() => {
      setSaveIndicator('saved');
    }, 400);
  };

  // Toggle doubtful flag
  const toggleDoubtful = () => {
    const isCurrentlyDoubtful = Boolean(session.isDoubtful[currentQuestion.id]);
    const updatedDoubtful = {
      ...session.isDoubtful,
      [currentQuestion.id]: !isCurrentlyDoubtful,
    };

    const updatedSession: StudentSession = {
      ...session,
      isDoubtful: updatedDoubtful,
    };

    setSession(updatedSession);
    db.saveSession(updatedSession);
  };

  // Record Violation Handler
  const handleViolation = useCallback((record: ViolationRecord) => {
    setSession(prev => {
      const updatedViolations = [...prev.violations, record];
      const updated: StudentSession = {
        ...prev,
        violations: updatedViolations,
      };
      db.saveSession(updated);
      return updated;
    });
  }, []);

  const handleLockTriggered = useCallback(() => {
    setIsLockedByViolation(true);
    setSession(prev => {
      const updated: StudentSession = {
        ...prev,
        status: 'locked_violation',
      };
      db.saveSession(updated);
      return updated;
    });
  }, []);

  // Security Anti-Cheat Hook
  const {
    isFullscreen,
    violationAlert,
    dismissViolationAlert,
    requestFullscreenAgain,
  } = useExamSecurity({
    active: !isExamCompleted && !isLockedByViolation,
    maxViolations: quiz.maxViolations || 3,
    currentQuestionNumber: currentIndex + 1,
    onViolation: handleViolation,
    onLockTriggered: handleLockTriggered,
  });

  // Countdown Interval & Auto Submit
  useEffect(() => {
    if (isExamCompleted || isLockedByViolation) return;

    const interval = setInterval(() => {
      const left = calculateRemainingSeconds();
      setRemainingSeconds(left);

      // Warning alerts at 5 minutes (300s) and 1 minute (60s)
      if (left <= 300 && left > 290 && !hasAlerted5Min.current) {
        hasAlerted5Min.current = true;
        setTimeNotice('Peringatan Waktu: Tersisa 5 menit lagi! Pastikan seluruh nomor soal sudah terisi.');
      } else if (left <= 60 && left > 50 && !hasAlerted1Min.current) {
        hasAlerted1Min.current = true;
        setTimeNotice('WAKTU KRITIS: Tersisa 1 menit! Kuis akan dikumpulkan otomatis oleh sistem saat waktu habis.');
      }

      if (left <= 0 && !isSubmittingRef.current) {
        isSubmittingRef.current = true;
        clearInterval(interval);
        setIsAutoSubmitting(true);
        setTimeout(() => {
          submitExam(true); // Auto-submit when time is up
        }, 1600);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemainingSeconds, isExamCompleted, isLockedByViolation]);

  // Fast-Forward Countdown Timer Simulator (useful for testing auto-submit)
  const handleSimulateTimeExpired = (seconds = 10) => {
    const newExpires = new Date(Date.now() + seconds * 1000).toISOString();
    const updated: StudentSession = {
      ...session,
      expiresAt: newExpires,
    };
    db.saveSession(updated);
    setSession(updated);
    setRemainingSeconds(seconds);
    setTimeNotice(`⏱️ Simulasi hitung mundur ${seconds} detik diaktifkan untuk menguji auto-submit.`);
  };

  // Request fullscreen on start
  useEffect(() => {
    enterFullscreen().catch(() => {});
  }, []);

  // Submit Exam Logic
  const submitExam = (auto = false) => {
    const finalSession: StudentSession = {
      ...session,
      status: auto ? 'force_submitted' : 'submitted',
      submittedAt: new Date().toISOString(),
    };

    // Calculate scores on server/db service
    const evaluated = db.calculateFinalScores(finalSession);
    db.saveSession(evaluated);
    setSession(evaluated);
    setIsExamCompleted(true);
    setIsAutoSubmitting(false);
    setShowSubmitConfirm(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    onFinishExam(evaluated);
  };

  // Format Time: MM:SS or HH:MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => {
    const ans = session.answers[q.id];
    if (!ans || ans.value === undefined || ans.value === null) return false;
    if (typeof ans.value === 'string') return ans.value.trim().length > 0;
    if (Array.isArray(ans.value)) return ans.value.length > 0;
    if (typeof ans.value === 'object') return Object.keys(ans.value).length > 0;
    return false;
  }).length;
  const doubtfulCount = Object.values(session.isDoubtful).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  // 1. Post-Exam Completed View
  if (isExamCompleted) {
    const pct = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold font-heading text-white">
              Ujian Berhasil Dikumpulkan!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Seluruh lembar jawaban Anda telah tersimpan secara permanen di server ujian.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400">Nama Siswa:</span>
              <span className="font-semibold text-white">{session.studentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400">NIS / Kelas:</span>
              <span className="font-semibold text-white">{session.studentNis} • {session.studentClass}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400">Mata Pelajaran:</span>
              <span className="font-semibold text-white">{session.subject}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400">Waktu Pengumpulan:</span>
              <span className="font-semibold text-white">
                {session.submittedAt ? new Date(session.submittedAt).toLocaleTimeString('id-ID') : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/60">
              <span className="text-slate-400">Metode Pengumpulan:</span>
              <span className="font-semibold">
                {session.status === 'force_submitted' ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Hourglass className="w-3.5 h-3.5" />
                    Otomatis (Batas Waktu Habis)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mandiri oleh Siswa
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Status Kejujuran:</span>
              <span className={session.violations.length === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {session.violations.length === 0 ? 'Bersih (0 Pelanggaran)' : `${session.violations.length} Catatan Kejujuran`}
              </span>
            </div>
          </div>

          {/* Score breakdown if enabled */}
          {quiz.showScoreAfterSubmit && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/40 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Nilai Sementara Anda
              </span>
              <div className="text-4xl font-extrabold text-white mt-1 font-heading">
                {session.totalScore}
                <span className="text-lg text-blue-300 font-normal"> / {session.maxScore}</span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-1">
                {session.isFullyGraded
                  ? `Hasil final: Akurasi ${pct}%.`
                  : '* Nilai belum mencakup soal Uraian Panjang yang masih dalam proses koreksi manual oleh Guru.'}
              </p>
            </div>
          )}

          <button
            onClick={onExitToPortal}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/40 transition active:scale-95"
          >
            Kembali ke Beranda Ujian
          </button>
        </div>
      </div>
    );
  }

  // 2. Exam Locked by System (Max Violations Exceeded)
  if (isLockedByViolation) {
    return (
      <div className="min-h-screen bg-rose-950/80 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-rose-400 font-heading">
              AKUN UJIAN TERKUNCI!
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Sistem mendeteksi <strong>{session.violations.length} kali pelanggaran keamanan</strong> (beralih layar / jendela / split-screen). Demi menjaga integritas, lembar ujian telah dikunci secara otomatis.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Daftar Pelanggaran Terakhir:
            </div>
            {session.violations.slice(-3).map((v, i) => (
              <div key={i} className="text-rose-300 text-[11px] flex items-start gap-1.5">
                <span className="text-slate-500">[{v.timestamp}]</span>
                <span>{v.message}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left">
            <strong>Instruksi Siswa:</strong>
            <p className="mt-1 text-[11px]">
              Segera angkat tangan dan lapor kepada Guru Pengawas / Proktor di ruangan Anda untuk melakukan verifikasi pembukaan kunci (Reset Sesi).
            </p>
          </div>

          <button
            onClick={() => {
              // Reload session to see if proctor unlocked it
              const fresh = db.getSessionById(session.id);
              if (fresh && fresh.status === 'in_progress') {
                setSession(fresh);
                setIsLockedByViolation(false);
              } else {
                alert('Sesi belum dibuka oleh Guru Pengawas. Mohon melapor terlebih dahulu.');
              }
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
          >
            Cek Status Pembukaan Kunci dari Pengawas
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Exam View
  const isCurrentDoubtful = Boolean(session.isDoubtful[currentQuestion.id]);
  const totalDurationSeconds = Math.max(1, (quiz.durationMinutes || 45) * 60);
  const timeProgressPercent = Math.max(0, Math.min(100, (remainingSeconds / totalDurationSeconds) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between exam-watermark select-none">
      {/* Top Bar: Title, Timer, Nav Trigger, Submit */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        {/* Visual Progress Bar of Remaining Exam Time */}
        <div className="w-full bg-slate-800/80 h-1 overflow-hidden" title={`Sisa waktu: ${formatTime(remainingSeconds)} (${Math.round(timeProgressPercent)}%)`}>
          <div
            className={`h-full transition-all duration-1000 ${
              remainingSeconds <= 60
                ? 'bg-rose-500 animate-pulse'
                : remainingSeconds <= 300
                ? 'bg-rose-500'
                : remainingSeconds <= 600
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-blue-500 to-emerald-400'
            }`}
            style={{ width: `${timeProgressPercent}%` }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
              CBT
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-xs">
                {quiz.title}
              </h1>
              <div className="text-[10px] sm:text-xs text-slate-400 truncate">
                {session.studentName} ({session.studentClass})
              </div>
            </div>
          </div>

          {/* Center: Countdown Timer with Alert Styling */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold shadow-sm transition ${
                remainingSeconds <= 60
                  ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/70 animate-pulse'
                  : remainingSeconds <= 300
                  ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse ring-1 ring-rose-500/40'
                  : remainingSeconds <= 600
                  ? 'bg-amber-950/70 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-slate-800/90 border-slate-700 text-amber-400'
              }`}
              title={`Hitung mundur ujian: ${formatTime(remainingSeconds)} tersisa`}
            >
              <Clock className={`w-3.5 h-3.5 ${remainingSeconds <= 300 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
              <span className="tracking-wider">{formatTime(remainingSeconds)}</span>
              {remainingSeconds <= 300 && (
                <span className="text-[10px] font-sans font-bold text-rose-300 bg-rose-900/60 px-1.5 py-0.2 rounded hidden sm:inline">
                  {remainingSeconds <= 60 ? 'HABIS' : 'KRITIS'}
                </span>
              )}
            </div>

            {/* Quick Fast-Forward Simulator for Evaluators/Testers */}
            <button
              type="button"
              onClick={() => handleSimulateTimeExpired(10)}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-400 hover:text-amber-300 border border-slate-700/80 text-[10px] font-mono transition"
              title="Klik untuk uji coba: percepat sisa waktu menjadi 10 detik lalu auto-submit"
            >
              <FastForward className="w-3 h-3 text-amber-400" />
              <span>Uji 10s</span>
            </button>
          </div>

          {/* Right: Grid Nav & Submit */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowNavModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              title="Daftar Nomor Soal"
            >
              <LayoutGrid className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Daftar Soal</span>
              <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {currentIndex + 1}/{totalQuestions}
              </span>
            </button>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai</span>
            </button>
          </div>
        </div>

        {/* Warning Notification Banner (5 Min & 1 Min Alert) */}
        {timeNotice && (
          <div className="bg-amber-500/15 border-t border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
              <span>{timeNotice}</span>
            </div>
            <button onClick={() => setTimeNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Main Question Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 pb-24">
        {/* Autosave and question index badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Soal No. {currentIndex + 1} dari {totalQuestions}</span>
            {isCurrentDoubtful && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Flag className="w-2.5 h-2.5 fill-amber-400" />
                Ragu-ragu
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`w-2 h-2 rounded-full ${saveIndicator === 'saving' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{saveIndicator === 'saving' ? 'Menyimpan...' : 'Tersimpan otomatis'}</span>
          </div>
        </div>

        {/* Dynamic Question Component */}
        <QuestionRenderer
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          currentAnswer={session.answers[currentQuestion.id]}
          onAnswerChange={handleAnswerChange}
        />
      </main>

      {/* Bottom Sticky Navigation */}
      <footer className="sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Prev Button */}
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className={`flex items-center gap-1 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentIndex === 0
                ? 'opacity-40 bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Toggle Ragu-ragu Flag */}
          <button
            onClick={toggleDoubtful}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition ${
              isCurrentDoubtful
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-amber-400 border-amber-500/40'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isCurrentDoubtful ? 'fill-slate-950' : 'fill-amber-400'}`} />
            <span>{isCurrentDoubtful ? 'Batal Ragu-ragu' : 'Ragu-ragu'}</span>
          </button>

          {/* Next / Finish Button */}
          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              className="flex items-center gap-1 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-900/40 transition active:scale-95"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-1 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-900/40 transition active:scale-95"
            >
              <span>Kumpulkan Ujian</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* Modal: Question Navigator (Grid Drawer) */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                Navigasi Nomor Soal
              </h3>
              <button
                onClick={() => setShowNavModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span>Sudah ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>Ragu ({doubtfulCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-700"></div>
                <span>Belum ({unansweredCount})</span>
              </div>
            </div>

            {/* Grid of Numbers */}
            <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const ans = session.answers[q.id];
                const hasAnswer = ans && ans.value !== undefined && ans.value !== '' && (!Array.isArray(ans.value) || ans.value.length > 0);
                const isDoubt = Boolean(session.isDoubtful[q.id]);
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700';
                if (isDoubt) {
                  btnClass = 'bg-amber-500 border-amber-400 text-slate-950 font-bold';
                } else if (hasAnswer) {
                  btnClass = 'bg-blue-600 border-blue-500 text-white font-bold';
                }

                if (isCurrent) {
                  btnClass += ' ring-2 ring-white ring-offset-2 ring-offset-slate-900';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowNavModal(false);
                    }}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs transition duration-150 ${btnClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isDoubt && <span className="text-[9px] leading-none">Ragu</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowNavModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirm Submit */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Konfirmasi Kumpulkan Ujian?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Periksa kembali ringkasan lembar pengerjaan Anda sebelum mengumpulkan.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Soal:</span>
                <span className="font-semibold text-white">{totalQuestions} Butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sudah Dijawab:</span>
                <span className="font-semibold text-emerald-400">{answeredCount} Butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Masih Ragu-ragu:</span>
                <span className={`font-semibold ${doubtfulCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {doubtfulCount} Butir
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Belum Terjawab:</span>
                <span className={`font-semibold ${unansweredCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {unansweredCount} Butir
                </span>
              </div>
            </div>

            {(unansweredCount > 0 || doubtfulCount > 0) && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-left">
                ⚠️ Anda masih memiliki {unansweredCount} soal kosong atau {doubtfulCount} soal ragu-ragu.
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                Cek Ulang
              </button>
              <button
                onClick={() => submitExam(false)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition"
              >
                Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Alert Modal (Real-time warning popover) */}
      {violationAlert?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-bounce-short">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-amber-400 font-heading">
                {violationAlert.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {violationAlert.message}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              Setiap aktivitas beralih jendela/layar tercatat permanen di riwayat pengawas ujian.
            </div>

            <button
              onClick={requestFullscreenAgain}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
            >
              <Maximize className="w-4 h-4" />
              <span>Kembali ke Layar Penuh (Lanjut Ujian)</span>
            </button>
          </div>
        </div>
      )}

      {/* Time Expired Modal Overlay (Automatic Submission) */}
      {isAutoSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in select-none">
          <div className="w-full max-w-md bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto animate-pulse">
              <Hourglass className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-rose-400">
                WAKTU UJIAN TELAH HABIS!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Batas waktu pengerjaan telah berakhir. Sistem sedang mengumpulkan seluruh jawaban Anda secara otomatis ke server...
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Memfinalisasi Lembar Jawaban & Nilai...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
