/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question, Quiz } from '../../types';
import { parseDocxFile, parseRawExamText, SAMPLE_DOCX_FORMAT } from '../../services/docxParser';
import { downloadExamTemplateDocx } from '../../services/docxTemplateGenerator';
import { db } from '../../services/db';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCode,
  Edit2,
  Download,
  Trash2,
  Plus,
  BookOpen,
  Sparkles,
  HelpCircle,
  Check,
  RefreshCw
} from 'lucide-react';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetQuiz?: Quiz | null;
  onImportComplete: (importedCount: number) => void;
}

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  targetQuiz,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide' | 'preview'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importTarget, setImportTarget] = useState<'quiz' | 'bank'>(targetQuiz ? 'quiz' : 'bank');
  const [selectedQuizId, setSelectedQuizId] = useState<string>(targetQuiz?.id || '');

  const quizzes = db.getQuizzes();

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setParseErrors([]);
    setParseWarnings([]);

    try {
      if (file.name.endsWith('.docx')) {
        const result = await parseDocxFile(file);
        setParsedQuestions(result.questions);
        setParseWarnings(result.warnings);
        setParseErrors(result.errors);
        if (result.questions.length > 0) setActiveTab('preview');
      } else {
        // Text / Markdown or other text files
        const text = await file.text();
        const result = parseRawExamText(text);
        setParsedQuestions(result.questions);
        setParseWarnings(result.warnings);
        setParseErrors(result.errors);
        if (result.questions.length > 0) setActiveTab('preview');
      }
    } catch (err: any) {
      setParseErrors(['Gagal memproses berkas: ' + (err.message || 'Format tidak didukung')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteText.trim()) return;
    setIsLoading(true);
    setParseErrors([]);
    setParseWarnings([]);

    try {
      const result = parseRawExamText(pasteText);
      setParsedQuestions(result.questions);
      setParseWarnings(result.warnings);
      setParseErrors(result.errors);
      if (result.questions.length > 0) setActiveTab('preview');
    } catch (err: any) {
      setParseErrors(['Terjadi kesalahan parsing: ' + err.message]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setPasteText(SAMPLE_DOCX_FORMAT);
    const result = parseRawExamText(SAMPLE_DOCX_FORMAT);
    setParsedQuestions(result.questions);
    setParseWarnings(result.warnings);
    setParseErrors(result.errors);
    setActiveTab('preview');
  };

  const handleUpdateParsedItem = (index: number, updated: Partial<Question>) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  const handleDeleteParsedItem = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveImport = () => {
    if (parsedQuestions.length === 0) return;

    if (importTarget === 'quiz') {
      const quizToUpdate = db.getQuizById(selectedQuizId);
      if (!quizToUpdate) {
        alert('Pilih kuis tujuan terlebih dahulu!');
        return;
      }
      const questionsWithQuizId = parsedQuestions.map(q => ({
        ...q,
        quizId: quizToUpdate.id,
      }));
      quizToUpdate.questions = [...quizToUpdate.questions, ...questionsWithQuizId];
      db.saveQuiz(quizToUpdate);
    } else {
      // Save directly to Question Bank
      parsedQuestions.forEach(q => {
        db.saveQuestionToBank({
          ...q,
          subject: targetQuiz?.subject || 'Umum',
        });
      });
    }

    onImportComplete(parsedQuestions.length);
    onClose();
  };

  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      await downloadExamTemplateDocx('Template_Format_Soal_SecureExam.docx');
    } catch (err: any) {
      alert('Gagal mengunduh template DOCX: ' + (err?.message || 'Error'));
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_DOCX_FORMAT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Format_Standar_Soal_SecureExam.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                Import Soal Ujian (DOCX / Teks / PDF)
              </h2>
              <p className="text-xs text-slate-400">
                Ekstraksi otomatis 5 tipe soal dengan pratinjau dan verifikasi manual sebelum disimpan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Unggah Berkas DOCX</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Salin-Tempel Teks</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan & Format DOCX</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={parsedQuestions.length === 0}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400'
                : parsedQuestions.length === 0
                ? 'border-transparent text-slate-600 cursor-not-allowed'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Verifikasi & Pratinjau</span>
            {parsedQuestions.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {parsedQuestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {parseErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 space-y-1">
              <strong className="block text-rose-400 font-semibold">Kesalahan Parsing:</strong>
              {parseErrors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          )}

          {parseWarnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 space-y-1">
              <strong className="block text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Catatan Penyesuaian Otomatis:
              </strong>
              {parseWarnings.map((w, i) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          )}

          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Card Template DOCX Download (Fitur Utama Permintaan Guru) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-indigo-950/40 border-2 border-blue-500/40 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-950/50">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">
                          Template Resmi Soal Ujian DOCX (Microsoft Word)
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          Kompatibel 100% Otomatis
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                        Unduh template DOCX standar sekolah yang sudah dilengkapi struktur resmi (nomor soal, opsi A-E, kunci jawaban, dan skor) untuk 5 tipe soal. Buka di Microsoft Word atau Google Docs, ganti soal Anda, lalu unggah berkasnya di bawah ini.
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadDocx}
                      disabled={isDownloadingDocx}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-900/50 transition disabled:opacity-50"
                    >
                      {isDownloadingDocx ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Membuat DOCX...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Unduh Template DOCX</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('guide')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Aturan Format</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> Pilihan Ganda
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> PG Kompleks
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> Menjodohkan
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Check className="w-3 h-3 text-emerald-400" /> Isian & Esai
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      Unduh Format .txt
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-blue-400 hover:text-blue-300 underline text-[11px] font-semibold"
                    >
                      Coba Ekstraksi Contoh Langsung
                    </button>
                  </div>
                </div>
              </div>

              {/* Area Unggah Berkas DOCX */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-7 text-center bg-slate-950/40 transition">
                <FileText className="w-10 h-10 text-blue-400 mx-auto mb-2.5" />
                <h3 className="text-sm font-semibold text-white">
                  Unggah Berkas DOCX Hasil Edit Template
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Sistem akan memindai seluruh halaman dokumen Word Anda dan mengekstrak butir soal, opsi, kunci jawaban, dan skor ke tabel pratinjau.
                </p>

                <label className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md transition active:scale-95">
                  <input
                    type="file"
                    accept=".docx,.txt,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>Pilih Dokumen (.docx / .txt)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB: PANDUAN FORMAT DOCX */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Panduan Format Dokumen DOCX & Aturan Ekstraksi Otomatis
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pastikan penulisan butir soal pada Microsoft Word mengikuti salah satu sintaks di bawah ini agar terbaca 100% tepat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={isDownloadingDocx}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File DOCX</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Pilihan Ganda Tunggal */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                    <span>1. Pilihan Ganda Tunggal</span>
                    <span className="text-[10px] text-slate-400 font-mono">1 Jawaban Benar</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`1. Ibukota negara Indonesia saat ini adalah...
A. Surabaya
B. Nusantara
C. Medan
D. Bandung
Kunci: B
Skor: 10
Pembahasan: IKN Nusantara di Kaltim.`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    Opsi harus diawali huruf kapital (A., B., C., D.). Kunci berupa 1 huruf (Kunci: B).
                  </p>
                </div>

                {/* 2. Pilihan Ganda Kompleks */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span>2. PG Kompleks (Multi-Pilihan)</span>
                    <span className="text-[10px] text-slate-400 font-mono">&gt;1 Jawaban Benar</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`2. Manakah perangkat keras yang termasuk output? (Kompleks)
A. Monitor
B. Keyboard
C. Printer
D. Mouse
Kunci: A, C
Skor: 20`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    Sertakan kata "(Kompleks)" di soal dan pisahkan kunci dengan koma (Kunci: A, C).
                  </p>
                </div>

                {/* 3. Menjodohkan */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-400">
                    <span>3. Menjodohkan / Mengelompokkan</span>
                    <span className="text-[10px] text-slate-400 font-mono">Pasangan [A] = [B]</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`3. Pasangkan negara dengan ibukotanya! (Menjodohkan)
[Jepang] = [Tokyo]
[Inggris] = [London]
[Prancis] = [Paris]
Skor: 20`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    Gunakan kurung siku dengan tanda sama dengan [Premis] = [Respon].
                  </p>
                </div>

                {/* 4. Isian Singkat & Esai */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>4. Isian Singkat & 5. Uraian Panjang</span>
                    <span className="text-[10px] text-slate-400 font-mono">Kata Kunci / Rubrik</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`4. Singkatan CPU adalah... (Uraian Singkat)
Kunci: Central Processing Unit
Skor: 15

5. Jelaskan siklus air! (Uraian Panjang)
Rubrik: Menjelaskan evaporasi & presipitasi.
Skor: 25`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    Sertakan penanda (Uraian Singkat) atau (Uraian Panjang) dan skor per nomor.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-300 text-xs flex items-center justify-between">
                <span>Ingin mencoba menguji parser dengan soal contoh di atas?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Muat Contoh ke Pratinjau
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tempelkan teks soal ujian Anda di bawah ini:</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-blue-400 hover:underline"
                >
                  Gunakan Contoh Soal
                </button>
              </div>
              <textarea
                rows={12}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="1. Pertanyaan...&#10;A. Pilihan satu&#10;B. Pilihan dua&#10;Kunci: A&#10;Skor: 10&#10;&#10;2. Pertanyaan kedua..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <button
                type="button"
                disabled={!pasteText.trim() || isLoading}
                onClick={handleProcessPastedText}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition"
              >
                Proses & Pratinjau Butir Soal
              </button>
            </div>
          )}

          {/* TAB 3: PREVIEW & VERIFICATION TABLE */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-white text-xs">
                    Hasil Ekstraksi: {parsedQuestions.length} Butir Soal Siap Disimpan
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Silakan koreksi teks, tipe, atau skor jika diperlukan sebelum finalisasi.
                  </span>
                </div>

                {/* Target Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={importTarget}
                    onChange={(e) => setImportTarget(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="quiz">Simpan ke Kuis Tertentu</option>
                    <option value="bank">Simpan ke Bank Soal Master</option>
                  </select>

                  {importTarget === 'quiz' && (
                    <select
                      value={selectedQuizId}
                      onChange={(e) => setSelectedQuizId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-blue-300 max-w-[200px]"
                    >
                      <option value="">-- Pilih Kuis --</option>
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Editable Question Cards */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-700 text-slate-300">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>Poin:</span>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => handleUpdateParsedItem(idx, { points: parseInt(e.target.value) || 0 })}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteParsedItem(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                        title="Hapus soal ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question text */}
                    <div>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={(e) => handleUpdateParsedItem(idx, { text: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Options Preview for MC */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.type === 'multiple_choice'
                            ? q.correctAnswer === opt.id
                            : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                // Toggle correct key inline
                                if (q.type === 'multiple_choice') {
                                  handleUpdateParsedItem(idx, { correctAnswer: opt.id });
                                } else {
                                  const cur = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                  const updated = cur.includes(opt.id)
                                    ? cur.filter(x => x !== opt.id)
                                    : [...cur, opt.id];
                                  handleUpdateParsedItem(idx, { correctAnswer: updated });
                                }
                              }}
                              className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
                              }`}
                            >
                              <span className="truncate">
                                <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt.text}
                              </span>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Matching Pairs Preview */}
                    {q.matchingPairs && q.matchingPairs.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                        <span className="font-semibold text-teal-400">Pasangan Menjodohkan:</span>
                        {q.matchingPairs.map(p => (
                          <div key={p.id} className="text-slate-300 flex items-center gap-1.5">
                            <span className="text-teal-300">[{p.premise}]</span> ➔ <span>[{p.response}]</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer Keywords */}
                    {q.shortAnswerKeywords && (
                      <div className="text-[11px] text-amber-300 flex items-center gap-1">
                        <span>Kata kunci jawaban:</span>
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {q.shortAnswerKeywords.join(', ') || 'Belum diisi'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            Batal
          </button>

          {activeTab === 'preview' ? (
            <button
              onClick={handleSaveImport}
              disabled={parsedQuestions.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan {parsedQuestions.length} Soal ke Sistem</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('preview')}
              disabled={parsedQuestions.length === 0}
              className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-semibold transition"
            >
              Lihat Pratinjau ({parsedQuestions.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
