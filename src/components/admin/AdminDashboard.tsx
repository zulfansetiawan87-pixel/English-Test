/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Quiz, StudentSession } from '../../types';
import { db } from '../../services/db';
import { cloudSync, CloudSyncStatus } from '../../services/cloudSync';
import { QuizManager } from './QuizManager';
import { QuestionBank } from './QuestionBank';
import { LiveProctoring } from './LiveProctoring';
import { EssayGrading } from './EssayGrading';
import { AnalyticsExport } from './AnalyticsExport';
import { SecuritySettings } from './SecuritySettings';
import { TeacherManager } from './TeacherManager';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import { KioskDocModal } from '../KioskDocModal';
import {
  Shield,
  Layers,
  BookOpen,
  Users,
  FileCheck,
  BarChart3,
  Lock,
  UploadCloud,
  LogOut,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Play,
  UserPlus,
  RefreshCw,
  Cloud
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onOpenStudentPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onOpenStudentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'quizzes' | 'bank' | 'proctoring' | 'grading' | 'analytics' | 'teachers' | 'security'
  >('quizzes');

  const [quizzes, setQuizzes] = useState<Quiz[]>(db.getQuizzes());
  const [sessions, setSessions] = useState<StudentSession[]>(db.getSessions());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
  });

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTargetQuiz, setSelectedTargetQuiz] = useState<Quiz | null>(null);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);

  const refreshData = () => {
    setQuizzes(db.getQuizzes());
    setSessions(db.getSessions());
  };

  useEffect(() => {
    const unsubStatus = cloudSync.subscribeStatus((st) => setSyncStatus(st));
    const unsubData = cloudSync.subscribeDataChange(() => {
      refreshData();
    });

    // Initial pull
    cloudSync.pullFromCloud().then(() => refreshData());

    return () => {
      unsubStatus();
      unsubData();
    };
  }, []);

  const handleOpenImport = (quiz?: Quiz) => {
    setSelectedTargetQuiz(quiz || null);
    setIsImportModalOpen(true);
  };

  // Metrics
  const activeSessionsCount = sessions.filter(s => s.status === 'in_progress').length;
  const lockedSessionsCount = sessions.filter(s => s.status === 'locked_violation').length;
  const submittedSessionsCount = sessions.filter(s => s.status === 'submitted' || s.status === 'force_submitted').length;
  const needsGradingCount = sessions.filter(s => !s.isFullyGraded && (s.status === 'submitted' || s.status === 'force_submitted')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50 border border-blue-400/30 flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2 truncate">
                SecureExam CBT
                <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Admin Guru
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                SMK Negeri 1 Informatika • Panel Pengawas & Pembuat Soal
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Cloud Status Indicator & Sync Now Button */}
            <button
              onClick={() => {
                cloudSync.pullFromCloud().then(() => refreshData());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                syncStatus.isSyncing
                  ? 'bg-blue-950/80 text-blue-300 border-blue-600/70'
                  : syncStatus.lastError
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/40'
              }`}
              title={
                syncStatus.lastSyncedAt
                  ? `Tersimpan di Cloud Online. Sinkronisasi terakhir: ${syncStatus.lastSyncedAt.toLocaleTimeString()}. Klik untuk sinkronisasi manual sekarang.`
                  : 'Klik untuk sinkronkan data soal dengan cloud server'
              }
            >
              <Cloud className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-pulse text-blue-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">
                {syncStatus.isSyncing ? 'Menyinkronkan...' : 'Cloud Tersimpan'}
              </span>
              <RefreshCw className={`w-3 h-3 ml-0.5 ${syncStatus.isSyncing ? 'animate-spin' : 'opacity-70'}`} />
            </button>

            <button
              onClick={() => handleOpenImport()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Import DOCX / PDF</span>
            </button>

            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30 text-xs font-semibold transition"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Kiosk APK</span>
            </button>

            <button
              onClick={onOpenStudentPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              title="Buka tampilan simulasi pengerjaan siswa"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Simulasi Siswa</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto gap-2 pt-3 border-t border-slate-800/80 mt-2 text-xs">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kelola Kuis</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded-full">
              {quizzes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'bank'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bank Soal</span>
          </button>

          <button
            onClick={() => setActiveTab('proctoring')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'proctoring'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Monitoring Peserta</span>
            {lockedSessionsCount > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {lockedSessionsCount} Terkunci
              </span>
            )}
            {activeSessionsCount > 0 && (
              <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded-full">
                {activeSessionsCount} Aktif
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('grading')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'grading'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Koreksi Uraian</span>
            {needsGradingCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                {needsGradingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analisis & Nilai</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Teacher Management</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Keamanan & Supabase</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'quizzes' && (
          <QuizManager
            quizzes={quizzes}
            onRefresh={refreshData}
            onOpenImportModal={(quiz) => handleOpenImport(quiz)}
          />
        )}

        {activeTab === 'bank' && (
          <QuestionBank
            quizzes={quizzes}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'proctoring' && (
          <LiveProctoring
            sessions={sessions}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'grading' && (
          <EssayGrading
            quizzes={quizzes}
            sessions={sessions}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsExport
            quizzes={quizzes}
            sessions={sessions}
          />
        )}

        {activeTab === 'teachers' && (
          <TeacherManager
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySettings
            onOpenKioskDoc={() => setIsKioskModalOpen(true)}
            onDataReset={refreshData}
          />
        )}
      </main>

      {/* Import Modal */}
      <ImportQuestionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetQuiz={selectedTargetQuiz}
        onImportComplete={(count) => {
          refreshData();
          alert(`Sukses mengimpor ${count} butir soal ke dalam sistem!`);
        }}
      />

      {/* Kiosk Doc Modal */}
      <KioskDocModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
      />
    </div>
  );
};
