/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Quiz, StudentSession } from '../../types';
import {
  exportExamResultsToExcel,
  exportExamResultsToCSV,
  calculateItemAnalysis
} from '../../services/exportService';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Search,
  Filter
} from 'lucide-react';

interface AnalyticsExportProps {
  quizzes: Quiz[];
  sessions: StudentSession[];
}

export const AnalyticsExport: React.FC<AnalyticsExportProps> = ({
  quizzes,
  sessions,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);

  const completedSessions = useMemo(() => {
    return sessions.filter(
      s => s.quizId === selectedQuizId && (s.status === 'submitted' || s.status === 'force_submitted')
    );
  }, [sessions, selectedQuizId]);

  const filteredList = useMemo(() => {
    return completedSessions.filter(
      s => s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.studentNis.includes(searchTerm) ||
           s.studentClass.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [completedSessions, searchTerm]);

  // Summary Statistics
  const stats = useMemo(() => {
    if (completedSessions.length === 0) {
      return { avgScore: 0, highestScore: 0, lowestScore: 0, passRate: 0, total: 0 };
    }
    const scores = completedSessions.map(s => s.totalScore);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const high = Math.max(...scores);
    const low = Math.min(...scores);
    const passedCount = completedSessions.filter(s => {
      const pct = s.maxScore > 0 ? (s.totalScore / s.maxScore) * 100 : 0;
      return pct >= 75;
    }).length;
    const passRate = Math.round((passedCount / completedSessions.length) * 100);

    return {
      avgScore: avg,
      highestScore: high,
      lowestScore: low,
      passRate,
      total: completedSessions.length
    };
  }, [completedSessions]);

  const itemAnalysis = useMemo(() => {
    if (!activeQuiz) return [];
    return calculateItemAnalysis(activeQuiz, sessions);
  }, [activeQuiz, sessions]);

  const handleExportExcel = () => {
    if (!activeQuiz) return;
    exportExamResultsToExcel(activeQuiz, completedSessions);
  };

  const handleExportCSV = () => {
    if (!activeQuiz) return;
    exportExamResultsToCSV(activeQuiz, completedSessions);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Selector & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 no-print">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">
            Analisis Butir Soal & Ekspor Nilai
          </h3>
          <p className="text-xs text-slate-400">
            Kalkulasi daya beda, tingkat kesukaran soal, dan ekspor lembar rekapitulasi nilai resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-300 focus:outline-none"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition"
            title="Download file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
            title="Download file CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
            title="Cetak Berita Acara & Lembar Nilai"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Official School Header for Print View */}
      <div className="hidden print-only mb-6 text-center border-b-2 border-black pb-4 text-black">
        <h1 className="text-xl font-bold uppercase tracking-wider">
          PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA
        </h1>
        <h2 className="text-lg font-bold uppercase">
          DINAS PENDIDIKAN • SMK NEGERI 1 INFORMATIKA
        </h2>
        <p className="text-xs">
          Jl. Pendidikan Kejuruan No. 45 • Telp: (021) 555-0199 • Laman: https://sekolah.sch.id
        </p>
        <div className="mt-3 text-sm font-bold border-t border-black pt-2">
          REKAPITULASI HASIL ASESMEN SUMATIF / PENILAIAN AKHIR SEMESTER (PAS)
        </div>
        <div className="text-xs mt-1">
          Mata Pelajaran: {activeQuiz?.subject} • Kuis: {activeQuiz?.title}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Rata-Rata Nilai</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-heading">
            {stats.avgScore}
            <span className="text-xs text-slate-500 font-normal"> / {activeQuiz?.questions.reduce((a, b) => a + b.points, 0) || 100}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Nilai Tertinggi</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-heading">
            {stats.highestScore}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Nilai Terendah</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-heading">
            {stats.lowestScore}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Ketuntasan (≥ 75)</span>
          </div>
          <div className="text-2xl font-extrabold text-teal-400 font-heading">
            {stats.passRate}%
            <span className="text-xs text-slate-500 font-normal"> ({stats.total} siswa)</span>
          </div>
        </div>
      </div>

      {/* Item Analysis Section (Tingkat Kesukaran & Daya Beda) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 no-print">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Tabel Analisis Butir Soal (Item Psychometrics)
            </h4>
            <p className="text-xs text-slate-400">
              Mendeteksi butir soal yang terlalu sukar, terlalu mudah, atau memerlukan revisi redaksi.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Tipe Soal</th>
                <th className="py-2.5 px-3">Ringkasan Soal</th>
                <th className="py-2.5 px-3 text-center">Menjawab Benar</th>
                <th className="py-2.5 px-3 text-center">Tingkat Akurasi</th>
                <th className="py-2.5 px-3">Tingkat Kesukaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {itemAnalysis.map(item => {
                let badgeColor = 'bg-blue-950 text-blue-300 border-blue-800';
                if (item.difficultyLabel === 'Sukar' || item.difficultyLabel === 'Sangat Sukar') {
                  badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
                } else if (item.difficultyLabel === 'Sangat Mudah' || item.difficultyLabel === 'Mudah') {
                  badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                }

                return (
                  <tr key={item.questionId} className="hover:bg-slate-850">
                    <td className="py-3 px-3 font-bold text-white">{item.questionNumber}</td>
                    <td className="py-3 px-3 uppercase text-[10px] text-slate-400 font-mono">
                      {item.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 text-slate-200 max-w-xs truncate">
                      {item.textSnippet}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-200">
                      {item.correctCount} / {item.totalAttempts}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold">
                        <span className="font-mono">{item.accuracyRate}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${item.accuracyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                        {item.difficultyLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Score Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Daftar Nilai Siswa ({filteredList.length})
          </h4>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa atau NIS..."
              className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">NIS</th>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3 text-center">Pelanggaran</th>
                <th className="py-2.5 px-3 text-center">Nilai Total</th>
                <th className="py-2.5 px-3 text-center">Persentase</th>
                <th className="py-2.5 px-3">Status Kelulusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredList.map((s, idx) => {
                const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
                const isPassed = pct >= 75;

                return (
                  <tr key={s.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{s.studentNis}</td>
                    <td className="py-3 px-3 font-bold text-white">{s.studentName}</td>
                    <td className="py-3 px-3 text-slate-400">{s.studentClass}</td>
                    <td className="py-3 px-3 text-center">
                      {s.violations.length > 0 ? (
                        <span className="text-amber-400 font-bold">{s.violations.length}x</span>
                      ) : (
                        <span className="text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-white font-mono text-sm">
                      {s.totalScore}
                      <span className="text-[10px] text-slate-500 font-normal"> / {s.maxScore}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {pct}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPassed
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
