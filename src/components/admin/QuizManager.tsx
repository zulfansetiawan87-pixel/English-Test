/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quiz, Question, QuestionType, OptionItem } from '../../types';
import { db } from '../../services/db';
import { MediaUploader } from './MediaUploader';
import {
  Plus,
  Edit3,
  Trash2,
  Clock,
  Key,
  Users,
  CheckCircle2,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Shuffle,
  Sparkles,
  Image,
  Headphones,
  Video,
  Award,
  Target,
  Minus,
  Check
} from 'lucide-react';

export const SCORE_PRESETS = [
  { value: 5, label: '5 Poin', category: 'Soal Ringan / Cepat' },
  { value: 10, label: '10 Poin', category: 'Standar Pilihan Ganda (10 Soal = 100)' },
  { value: 15, label: '15 Poin', category: 'Sedang / Isian Singkat' },
  { value: 20, label: '20 Poin', category: 'Menengah / PG Kompleks (5 Soal = 100)' },
  { value: 25, label: '25 Poin', category: 'Analisis / Esai Singkat (4 Soal = 100)' },
  { value: 30, label: '30 Poin', category: 'HOTS / Esai Panjang' },
  { value: 40, label: '40 Poin', category: 'Studi Kasus Utama' },
  { value: 50, label: '50 Poin', category: 'Bobot Khusus / Proyek (2 Soal = 100)' },
];

export const RECOMMENDED_TYPE_POINTS: Record<QuestionType, number> = {
  multiple_choice: 10,
  complex_multiple_choice: 20,
  multimodal: 20,
  matching: 20,
  short_answer: 15,
  essay: 25,
};

interface QuizManagerProps {
  quizzes: Quiz[];
  onRefresh: () => void;
  onOpenImportModal: (quiz: Quiz) => void;
}

export const QuizManager: React.FC<QuizManagerProps> = ({
  quizzes,
  onRefresh,
  onOpenImportModal,
}) => {
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(quizzes[0]?.id || null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    quizId: string;
    question: Question;
    isNew?: boolean;
  } | null>(null);

  // New Quiz / Edit Quiz Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formClasses, setFormClasses] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [formToken, setFormToken] = useState('');
  const [formShuffleQuestions, setFormShuffleQuestions] = useState(false);
  const [formShuffleOptions, setFormShuffleOptions] = useState(true);
  const [formShowScore, setFormShowScore] = useState(true);
  const [formMaxViolations, setFormMaxViolations] = useState(3);
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');

  const openCreateModal = () => {
    setEditingQuiz(null);
    setFormTitle('');
    setFormSubject('Informatika');
    setFormClasses('');
    setFormDuration(45);
    setFormToken('SMK' + Math.floor(1000 + Math.random() * 9000));
    setFormShuffleQuestions(false);
    setFormShuffleOptions(true);
    setFormShowScore(true);
    setFormMaxViolations(3);
    setFormStatus('active');
    setIsCreatingNew(true);
  };

  const openEditModal = (q: Quiz) => {
    setEditingQuiz(q);
    setFormTitle(q.title);
    setFormSubject(q.subject);
    setFormClasses(q.targetClasses.join(', '));
    setFormDuration(q.durationMinutes);
    setFormToken(q.token || '');
    setFormShuffleQuestions(q.shuffleQuestions);
    setFormShuffleOptions(q.shuffleOptions);
    setFormShowScore(q.showScoreAfterSubmit);
    setFormMaxViolations(q.maxViolations || 3);
    setFormStatus(q.status);
    setIsCreatingNew(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const classArray = formClasses.split(',').map(c => c.trim()).filter(Boolean);

    if (editingQuiz) {
      const updated: Quiz = {
        ...editingQuiz,
        title: formTitle,
        subject: formSubject,
        targetClasses: classArray.length > 0 ? classArray : ['Semua Kelas'],
        durationMinutes: Number(formDuration) || 45,
        token: formToken.trim().toUpperCase() || undefined,
        shuffleQuestions: formShuffleQuestions,
        shuffleOptions: formShuffleOptions,
        showScoreAfterSubmit: formShowScore,
        maxViolations: Number(formMaxViolations) || 3,
        status: formStatus,
      };
      db.saveQuiz(updated);
    } else {
      const newQuiz: Quiz = {
        id: 'quiz-' + Date.now(),
        title: formTitle,
        subject: formSubject,
        targetClasses: classArray.length > 0 ? classArray : ['Semua Kelas'],
        description: 'Ujian asesmen terstandar sekolah.',
        durationMinutes: Number(formDuration) || 45,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
        token: formToken.trim().toUpperCase() || undefined,
        shuffleQuestions: formShuffleQuestions,
        shuffleOptions: formShuffleOptions,
        showScoreAfterSubmit: formShowScore,
        maxViolations: Number(formMaxViolations) || 3,
        status: formStatus,
        createdAt: new Date().toISOString(),
        questions: [],
      };
      db.saveQuiz(newQuiz);
      setExpandedQuizId(newQuiz.id);
    }

    setIsCreatingNew(false);
    onRefresh();
  };

  const handleDeleteQuiz = (id: string, title: string) => {
    if (confirm(`Hapus kuis "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      db.deleteQuiz(id);
      onRefresh();
    }
  };

  const handleDeleteQuestion = (quizId: string, questionId: string) => {
    const quiz = db.getQuizById(quizId);
    if (!quiz) return;
    if (confirm('Hapus soal ini dari kuis?')) {
      quiz.questions = quiz.questions.filter(q => q.id !== questionId);
      db.saveQuiz(quiz);
      onRefresh();
    }
  };

  const openAddQuestion = (quizId: string, initialPoints?: number) => {
    const quiz = db.getQuizById(quizId);
    let defaultScore = initialPoints;
    if (!defaultScore) {
      if (quiz && quiz.questions.length > 0) {
        const currentSum = quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);
        if (currentSum < 100 && (100 - currentSum) <= 50 && (100 - currentSum) > 0) {
          // Jika mendekati 100 poin, sarankan sisa poin agar pas 100
          defaultScore = 100 - currentSum;
        } else {
          defaultScore = 10;
        }
      } else {
        defaultScore = 10;
      }
    }

    const newQ: Question = {
      id: 'q-' + Date.now(),
      quizId,
      type: 'multiple_choice',
      text: '',
      points: defaultScore,
      options: [
        { id: 'opt-1', text: 'Pilihan Jawaban A' },
        { id: 'opt-2', text: 'Pilihan Jawaban B' },
        { id: 'opt-3', text: 'Pilihan Jawaban C' },
        { id: 'opt-4', text: 'Pilihan Jawaban D' },
      ],
      correctAnswer: 'opt-1',
    };
    setEditingQuestion({ quizId, question: newQ, isNew: true });
  };

  const handleSaveQuestion = (q: Question) => {
    if (!editingQuestion) return;
    const quiz = db.getQuizById(editingQuestion.quizId);
    if (!quiz) return;

    const idx = quiz.questions.findIndex(item => item.id === q.id);
    if (idx >= 0) {
      quiz.questions[idx] = q;
    } else {
      quiz.questions.push(q);
    }
    db.saveQuiz(quiz);
    setEditingQuestion(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Create Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">
            Daftar Kuis & Asesmen Sekolah ({quizzes.length})
          </h3>
          <p className="text-xs text-slate-400">
            Kelola jadwal, durasi, token, kelas sasaran, dan butir soal kuis.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-900/40 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kuis Baru</span>
        </button>
      </div>

      {/* Quizzes List Accordion */}
      <div className="space-y-4">
        {quizzes.map(quiz => {
          const isExpanded = expandedQuizId === quiz.id;
          const totalPoints = quiz.questions.reduce((a, b) => a + b.points, 0);

          return (
            <div
              key={quiz.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition"
            >
              {/* Quiz Summary Header */}
              <div
                onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850 transition select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-400 font-mono">
                      {quiz.subject}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        quiz.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{quiz.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {quiz.durationMinutes} Menit
                    </span>
                    {quiz.token && (
                      <span className="flex items-center gap-1 font-mono text-amber-300">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Token: {quiz.token}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {quiz.targetClasses.join(', ')}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {quiz.questions.length} Butir Soal ({totalPoints} Poin)
                    </span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenImportModal(quiz)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                    title="Import DOCX/PDF ke kuis ini"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import Soal</span>
                  </button>

                  <button
                    onClick={() => openEditModal(quiz)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Pengaturan Kuis"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                    title="Hapus Kuis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-1 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Questions Section when Expanded */}
              {isExpanded && (
                <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Daftar Butir Soal ({quiz.questions.length} Butir)
                      </span>
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        totalPoints === 100
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : totalPoints > 100
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : 'bg-blue-950/80 text-blue-400 border-blue-800'
                      }`}>
                        Total: {totalPoints} Poin {totalPoints === 100 ? '✓ (Pas 100)' : `(${totalPoints < 100 ? `Kurang ${100 - totalPoints}` : `+${totalPoints - 100}`})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Pilihan Skor Cepat:</span>
                      <button
                        onClick={() => openAddQuestion(quiz.id, 10)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 text-[11px] font-mono transition"
                        title="Tambah soal baru langsung dengan bobot 10 Poin"
                      >
                        +10 Poin
                      </button>
                      <button
                        onClick={() => openAddQuestion(quiz.id, 20)}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 text-[11px] font-mono transition"
                        title="Tambah soal baru langsung dengan bobot 20 Poin"
                      >
                        +20 Poin
                      </button>

                      <button
                        onClick={() => openAddQuestion(quiz.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Soal Manual</span>
                      </button>
                    </div>
                  </div>

                  {quiz.questions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs space-y-2">
                      <p>Kuis ini belum memiliki butir soal.</p>
                      <button
                        onClick={() => onOpenImportModal(quiz)}
                        className="text-blue-400 hover:underline"
                      >
                        Unggah berkas DOCX sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quiz.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                                  q.type === 'multimodal'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {q.type === 'multimodal' ? '🌟 Teks Multimodal' : q.type.replace(/_/g, ' ')}
                                </span>
                                {q.media && q.media.length > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-medium">
                                    {q.media.some(m => m.type === 'image') && <Image className="w-3 h-3 text-blue-400" />}
                                    {q.media.some(m => m.type === 'audio') && <Headphones className="w-3 h-3 text-indigo-400" />}
                                    {q.media.some(m => m.type === 'video') && <Video className="w-3 h-3 text-rose-400" />}
                                    <span>{q.media.length} Media</span>
                                  </span>
                                )}
                                <span className="text-amber-400 font-medium">{q.points} Poin</span>
                              </div>
                              <p className="text-slate-200 line-clamp-2 leading-relaxed">
                                {q.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingQuestion({ quizId: quiz.id, question: { ...q } })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Edit Soal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Quiz */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-heading">
                {editingQuiz ? 'Ubah Pengaturan Kuis' : 'Buat Kuis Baru'}
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Judul Kuis / Asesmen</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester Genap"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Informatika"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Durasi (Menit)</label>
                  <input
                    type="number"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 45)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Kelas Sasaran (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  required
                  value={formClasses}
                  onChange={(e) => setFormClasses(e.target.value)}
                  placeholder="X RPL 1, X RPL 2, Semua Kelas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Token Masuk (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formToken}
                    onChange={(e) => setFormToken(e.target.value.toUpperCase())}
                    placeholder="PAS2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Batas Maksimal Pelanggaran
                  </label>
                  <input
                    type="number"
                    value={formMaxViolations}
                    onChange={(e) => setFormMaxViolations(parseInt(e.target.value) || 3)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Acak Urutan Soal Siswa</span>
                  <input
                    type="checkbox"
                    checked={formShuffleQuestions}
                    onChange={(e) => setFormShuffleQuestions(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-800"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Acak Opsi Jawaban (A/B/C/D)</span>
                  <input
                    type="checkbox"
                    checked={formShuffleOptions}
                    onChange={(e) => setFormShuffleOptions(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-800"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Tampilkan Nilai ke Siswa Setelah Submit</span>
                  <input
                    type="checkbox"
                    checked={formShowScore}
                    onChange={(e) => setFormShowScore(e.target.checked)}
                    className="rounded text-blue-600 bg-slate-800"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Simpan Kuis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Question Dialog */}
      {editingQuestion && (() => {
        const activeQuizForQuestion = quizzes.find(q => q.id === editingQuestion.quizId);
        const currentQuizPointsExcludingThis = activeQuizForQuestion
          ? activeQuizForQuestion.questions
              .filter(q => q.id !== editingQuestion.question.id)
              .reduce((sum, q) => sum + (q.points || 0), 0)
          : 0;
        const projectedTotalPoints = currentQuizPointsExcludingThis + (editingQuestion.question.points || 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                    {editingQuestion.isNew ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{editingQuestion.isNew ? 'Tambah Butir Soal Baru (Manual)' : 'Edit Butir Soal Kuis'}</span>
                      {activeQuizForQuestion && (
                        <span className="text-[10px] text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono">
                          {activeQuizForQuestion.title}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {editingQuestion.isNew
                        ? 'Pilih tipe soal, tentukan pilihan skor bobot nilai, dan susun opsi/kunci jawaban.'
                        : 'Perbarui tipe soal, pilihan skor bobot nilai, media stimulus, atau kunci jawaban.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tipe Soal Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Tipe Soal:</label>
                <select
                  value={editingQuestion.question.type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType;
                    const recommendedPoints = RECOMMENDED_TYPE_POINTS[newType] || 10;
                    setEditingQuestion({
                      ...editingQuestion,
                      question: {
                        ...editingQuestion.question,
                        type: newType,
                        points: editingQuestion.isNew ? recommendedPoints : editingQuestion.question.points,
                        multimodalResponseType: newType === 'multimodal'
                          ? editingQuestion.question.multimodalResponseType || 'multiple_choice'
                          : undefined,
                        options: (newType === 'multiple_choice' || newType === 'complex_multiple_choice' || newType === 'multimodal')
                          ? editingQuestion.question.options || [
                              { id: 'opt-a', text: 'Pilihan A' },
                              { id: 'opt-b', text: 'Pilihan B' },
                              { id: 'opt-c', text: 'Pilihan C' },
                              { id: 'opt-d', text: 'Pilihan D' },
                            ]
                          : undefined,
                      }
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="multiple_choice">Pilihan Ganda (1 Benar)</option>
                  <option value="complex_multiple_choice">Pilihan Ganda Kompleks (Multi Jawaban)</option>
                  <option value="multimodal">🌟 Teks Multimodal (Gambar, Audio, Video)</option>
                  <option value="matching">Menjodohkan / Mengelompokkan</option>
                  <option value="short_answer">Uraian Singkat / Isian</option>
                  <option value="essay">Uraian Panjang (Esai Analisis)</option>
                </select>
              </div>

              {/* Pilihan Bobot Skor / Poin Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200 text-xs">Pilihan Skor untuk Soal Ini:</span>
                    <span className="text-[11px] text-amber-300 font-mono font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {editingQuestion.question.points} Poin
                    </span>
                  </div>

                  {RECOMMENDED_TYPE_POINTS[editingQuestion.question.type] && (
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, points: RECOMMENDED_TYPE_POINTS[editingQuestion.question.type] }
                      })}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                      title="Terapkan bobot rekomendasi untuk tipe soal ini"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Rekomendasi Tipe Ini: {RECOMMENDED_TYPE_POINTS[editingQuestion.question.type]} Poin</span>
                    </button>
                  )}
                </div>

                {/* 1. Tombol Opsi Skor Cepat (Quick Preset Buttons) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-medium">Klik Pilihan Skor Standar:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {SCORE_PRESETS.map((preset) => {
                      const isSelected = editingQuestion.question.points === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, points: preset.value }
                          })}
                          className={`py-2 px-1.5 rounded-xl text-center font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40 ring-2 ring-blue-500/30'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                          }`}
                          title={preset.category}
                        >
                          <span className="text-xs font-mono">{preset.value}</span>
                          <span className="text-[9px] opacity-80 leading-none">Poin</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Dropdown Skema Kategori & Stepper Manual Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Kategori Bobot Penilaian:</span>
                    <select
                      value={
                        SCORE_PRESETS.some(p => p.value === editingQuestion.question.points)
                          ? String(editingQuestion.question.points)
                          : 'custom'
                      }
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          const val = parseInt(e.target.value, 10);
                          setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, points: val }
                          });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs"
                    >
                      {SCORE_PRESETS.map(p => (
                        <option key={p.value} value={String(p.value)}>
                          {p.value} Poin - {p.category}
                        </option>
                      ))}
                      <option value="custom">Kustom (Ketik nilai skor sendiri)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-medium">Atur Skor Presisi / Bebas:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion({
                          ...editingQuestion,
                          question: {
                            ...editingQuestion.question,
                            points: Math.max(1, (editingQuestion.question.points || 10) - 5)
                          }
                        })}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        title="Kurangi 5 poin"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={editingQuestion.question.points}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, points: val }
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-center font-bold text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingQuestion({
                          ...editingQuestion,
                          question: {
                            ...editingQuestion.question,
                            points: (editingQuestion.question.points || 10) + 5
                          }
                        })}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        title="Tambah 5 poin"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Kalkulator Live Simulasi Akumulasi Nilai Kuis */}
                {activeQuizForQuestion && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Target className="w-3.5 h-3.5 text-blue-400" />
                        <span>Akumulasi Total Skor Kuis:</span>
                      </span>
                      <span className="font-mono font-bold">
                        <span className="text-slate-400">{currentQuizPointsExcludingThis}</span>
                        <span className="text-blue-400"> + {editingQuestion.question.points}</span>
                        <span className="text-white"> = {projectedTotalPoints} Poin</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          projectedTotalPoints === 100
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-400'
                            : projectedTotalPoints > 100
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (projectedTotalPoints / 100) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {projectedTotalPoints === 100 ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Target 100 Poin Ideal Asesmen Tercapai!
                          </span>
                        ) : projectedTotalPoints < 100 ? (
                          <span>Masih kurang <strong className="text-amber-400">{100 - projectedTotalPoints} poin</strong> menuju target 100.</span>
                        ) : (
                          <span className="text-amber-400">Total melebihi 100 poin (+{projectedTotalPoints - 100} poin).</span>
                        )}
                      </span>
                      <span className="text-slate-500 font-mono">Standar: 100 Poin</span>
                    </div>
                  </div>
                )}
              </div>

            {/* If Multimodal: Response format selector */}
            {editingQuestion.question.type === 'multimodal' && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/50 space-y-1.5">
                <label className="font-bold text-indigo-300 block text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Format Respon Jawaban Siswa untuk Stimulus Multimodal:</span>
                </label>
                <select
                  value={editingQuestion.question.multimodalResponseType || 'multiple_choice'}
                  onChange={(e) => {
                    const resp = e.target.value as any;
                    setEditingQuestion({
                      ...editingQuestion,
                      question: {
                        ...editingQuestion.question,
                        multimodalResponseType: resp,
                        options: (resp === 'multiple_choice' || resp === 'complex_multiple_choice')
                          ? editingQuestion.question.options || [
                              { id: 'opt-a', text: 'Pilihan A' },
                              { id: 'opt-b', text: 'Pilihan B' },
                              { id: 'opt-c', text: 'Pilihan C' },
                              { id: 'opt-d', text: 'Pilihan D' },
                            ]
                          : undefined,
                      }
                    });
                  }}
                  className="w-full bg-slate-950 border border-indigo-600/70 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="multiple_choice">Pilihan Ganda Biasa (1 Jawaban Benar)</option>
                  <option value="complex_multiple_choice">Pilihan Ganda Kompleks (Banyak Jawaban Benar)</option>
                  <option value="short_answer">Uraian / Isian Singkat (Kata Kunci)</option>
                  <option value="essay">Uraian Panjang / Analisis Esai (Penilaian Guru)</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">
                {editingQuestion.question.type === 'multimodal'
                  ? 'Teks Pengantar / Stimulus Bacaan Soal Multimodal:'
                  : 'Teks Soal:'}
              </label>
              <textarea
                rows={3}
                value={editingQuestion.question.text}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  question: { ...editingQuestion.question, text: e.target.value }
                })}
                placeholder={
                  editingQuestion.question.type === 'multimodal'
                    ? 'Tuliskan bacaan stimulus, konteks pengantar, atau pertanyaan di sini...'
                    : 'Tuliskan pertanyaan soal di sini...'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Media Uploader Section (Gambar, Suara/Audio, Video) */}
            <MediaUploader
              mediaList={editingQuestion.question.media || []}
              onChange={(updatedMedia) => setEditingQuestion({
                ...editingQuestion,
                question: { ...editingQuestion.question, media: updatedMedia }
              })}
            />

            {/* Options for MC & Complex MC & Multimodal Choice */}
            {((editingQuestion.question.type === 'multiple_choice' || editingQuestion.question.type === 'complex_multiple_choice') ||
              (editingQuestion.question.type === 'multimodal' &&
                (editingQuestion.question.multimodalResponseType === 'multiple_choice' ||
                 editingQuestion.question.multimodalResponseType === 'complex_multiple_choice' ||
                 !editingQuestion.question.multimodalResponseType))) &&
              editingQuestion.question.options && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 block">
                    Pilihan Jawaban (Tandai kunci jawaban yang benar):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editingQuestion.question.options || [];
                      const newId = 'opt-' + Date.now();
                      setEditingQuestion({
                        ...editingQuestion,
                        question: {
                          ...editingQuestion.question,
                          options: [...cur, { id: newId, text: `Pilihan Jawaban ${String.fromCharCode(65 + cur.length)}` }]
                        }
                      });
                    }}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Opsi</span>
                  </button>
                </div>

                {editingQuestion.question.options.map((opt, oIdx) => {
                  const isMulti = editingQuestion.question.type === 'complex_multiple_choice' ||
                                  (editingQuestion.question.type === 'multimodal' && editingQuestion.question.multimodalResponseType === 'complex_multiple_choice');

                  const isChecked = isMulti
                    ? Array.isArray(editingQuestion.question.correctAnswer) && editingQuestion.question.correctAnswer.includes(opt.id)
                    : editingQuestion.question.correctAnswer === opt.id;

                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name="correctKeyRadio"
                        checked={isChecked}
                        onChange={() => {
                          if (!isMulti) {
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, correctAnswer: opt.id }
                            });
                          } else {
                            const cur = Array.isArray(editingQuestion.question.correctAnswer) ? editingQuestion.question.correctAnswer : [];
                            const updated = cur.includes(opt.id) ? cur.filter(x => x !== opt.id) : [...cur, opt.id];
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, correctAnswer: updated }
                            });
                          }
                        }}
                      />
                      <span className="font-bold text-slate-400 w-4">{String.fromCharCode(65 + oIdx)}.</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const copyOpts = [...(editingQuestion.question.options || [])];
                          copyOpts[oIdx] = { ...copyOpts[oIdx], text: e.target.value };
                          setEditingQuestion({
                            ...editingQuestion,
                            question: { ...editingQuestion.question, options: copyOpts }
                          });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                      {editingQuestion.question.options && editingQuestion.question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const copyOpts = (editingQuestion.question.options || []).filter(o => o.id !== opt.id);
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, options: copyOpts }
                            });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Answer Keywords */}
            {(editingQuestion.question.type === 'short_answer' ||
              (editingQuestion.question.type === 'multimodal' && editingQuestion.question.multimodalResponseType === 'short_answer')) && (
              <div className="space-y-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <label className="font-semibold text-slate-300 block">
                  Kata Kunci Jawaban Benar (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={(editingQuestion.question.shortAnswerKeywords || []).join(', ')}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: {
                      ...editingQuestion.question,
                      shortAnswerKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="Kunci 1, Kunci 2, alternatif"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}

            {/* Essay Rubric */}
            {(editingQuestion.question.type === 'essay' ||
              (editingQuestion.question.type === 'multimodal' && editingQuestion.question.multimodalResponseType === 'essay')) && (
              <div className="space-y-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <label className="font-semibold text-slate-300 block">
                  Rubrik Penilaian Esai Guru
                </label>
                <input
                  type="text"
                  value={editingQuestion.question.essayRubric || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, essayRubric: e.target.value }
                  })}
                  placeholder="Panduan pemberian skor..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Award className="w-4 h-4 text-amber-400" />
                <span>
                  Skor yang akan diberikan:{' '}
                  <strong className="text-amber-400 font-mono font-bold text-sm">
                    {editingQuestion.question.points} Poin
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuestion(editingQuestion.question)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-blue-900/40"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingQuestion.isNew ? 'Simpan & Tambah Soal' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
};
