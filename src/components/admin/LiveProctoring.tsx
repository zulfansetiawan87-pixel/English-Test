/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentSession, ViolationRecord } from '../../types';
import { db } from '../../services/db';
import {
  ShieldAlert,
  Unlock,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  X,
  UserCheck
} from 'lucide-react';

interface LiveProctoringProps {
  sessions: StudentSession[];
  onRefresh: () => void;
}

export const LiveProctoring: React.FC<LiveProctoringProps> = ({
  sessions,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'locked_violation' | 'submitted'>('all');
  const [selectedViolationLog, setSelectedViolationLog] = useState<{
    studentName: string;
    studentNis: string;
    violations: ViolationRecord[];
  } | null>(null);

  const filteredSessions = sessions.filter(s => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentNis.includes(searchTerm) ||
      s.studentClass.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUnlock = (sessionId: string) => {
    if (confirm('Buka kunci ujian untuk siswa ini? Peserta akan diizinkan kembali melanjutkan pengerjaan.')) {
      db.unlockStudent(sessionId);
      onRefresh();
    }
  };

  const handleResetSession = (sessionId: string, name: string) => {
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin me-reset sesi untuk "${name}"? Timer akan dimulai ulang.`)) {
      db.resetStudentSession(sessionId);
      onRefresh();
    }
  };

  const handleForceSubmit = (sessionId: string, name: string) => {
    if (confirm(`Paksa kumpulkan lembar jawaban milik "${name}" sekarang? Nilai yang tersimpan akan langsung dikalkulasi.`)) {
      db.forceSubmitStudent(sessionId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NIS, atau kelas..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">Semua Status Siswa ({sessions.length})</option>
            <option value="in_progress">Sedang Mengerjakan</option>
            <option value="locked_violation">⚠️ Terkunci Pelanggaran</option>
            <option value="submitted">Sudah Selesai</option>
          </select>
        </div>
      </div>

      {/* Student Session Cards / Table */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          <UserCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">Tidak ada peserta ujian yang cocok dengan kriteria filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map(session => {
            const isLocked = session.status === 'locked_violation';
            const isDone = session.status === 'submitted' || session.status === 'force_submitted';
            const violationCount = session.violations.length;
            const answeredCount = Object.keys(session.answers).length;

            return (
              <div
                key={session.id}
                className={`p-4 rounded-2xl border transition shadow-lg relative flex flex-col justify-between ${
                  isLocked
                    ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50 shadow-rose-950/40'
                    : isDone
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-slate-900 border-blue-600/30 ring-1 ring-blue-500/20'
                }`}
              >
                <div>
                  {/* Top Status & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      NIS: {session.studentNis}
                    </span>

                    {isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-900/60 border border-rose-500/50 px-2 py-0.5 rounded-full animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        TERKUNCI
                      </span>
                    ) : isDone ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                        Mengerjakan
                      </span>
                    )}
                  </div>

                  {/* Name and class */}
                  <h4 className="text-sm font-bold text-white truncate">{session.studentName}</h4>
                  <div className="text-xs text-slate-400 font-medium">
                    {session.studentClass} • <span className="text-slate-300">{session.quizTitle}</span>
                  </div>

                  {/* Progress details */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Jawaban Masuk:</span>
                      <span className="font-semibold text-slate-200">{answeredCount} Soal</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Log Integritas:</span>
                      {violationCount > 0 ? (
                        <button
                          onClick={() => setSelectedViolationLog({
                            studentName: session.studentName,
                            studentNis: session.studentNis,
                            violations: session.violations
                          })}
                          className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{violationCount} Catatan</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-semibold">0 Pelanggaran</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Bar for Proctor */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  {isLocked && (
                    <button
                      onClick={() => handleUnlock(session.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-md transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Kunci</span>
                    </button>
                  )}

                  {!isDone && !isLocked && (
                    <>
                      <button
                        onClick={() => handleResetSession(session.id, session.studentName)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition"
                        title="Mulai ulang timer dan sesi siswa"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Sesi</span>
                      </button>

                      <button
                        onClick={() => handleForceSubmit(session.id, session.studentName)}
                        className="py-1.5 px-2 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs flex items-center gap-1 transition"
                        title="Paksa kumpulkan lembar jawaban saat ini"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kumpulkan</span>
                      </button>
                    </>
                  )}

                  {isDone && (
                    <div className="text-xs text-slate-400 font-mono">
                      Nilai: <strong className="text-white">{session.totalScore}</strong> / {session.maxScore}
                    </div>
                  )}

                  {violationCount > 0 && (
                    <button
                      onClick={() => setSelectedViolationLog({
                        studentName: session.studentName,
                        studentNis: session.studentNis,
                        violations: session.violations
                      })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Lihat riwayat waktu pelanggaran"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Violation History Modal */}
      {selectedViolationLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Log Rekam Jejak Pelanggaran
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedViolationLog.studentName} (NIS: {selectedViolationLog.studentNis})
                </p>
              </div>
              <button
                onClick={() => setSelectedViolationLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedViolationLog.violations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada catatan pelanggaran.</p>
              ) : (
                selectedViolationLog.violations.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Waktu: {v.timestamp}</span>
                      <span className="text-amber-400 uppercase text-[10px] bg-amber-950/60 px-1.5 py-0.2 rounded">
                        {v.type}
                      </span>
                    </div>
                    <p className="text-slate-200">{v.message}</p>
                    {v.questionNumber && (
                      <span className="text-[10px] text-slate-500">Terjadi saat membuka Soal No. {v.questionNumber}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedViolationLog(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Tutup Riwayat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
