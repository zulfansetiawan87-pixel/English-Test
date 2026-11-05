/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Quiz, StudentSession, Question } from '../../types';
import { db } from '../../services/db';
import { MultimodalViewer } from '../common/MultimodalViewer';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  Save,
  User,
  ChevronRight,
  Filter
} from 'lucide-react';

interface EssayGradingProps {
  quizzes: Quiz[];
  sessions: StudentSession[];
  onRefresh: () => void;
}

export const EssayGrading: React.FC<EssayGradingProps> = ({
  quizzes,
  sessions,
  onRefresh,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [scoresInput, setScoresInput] = useState<Record<string, number>>({});
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId);
  const essayQuestions = activeQuiz?.questions.filter(
    q => q.type === 'essay' || (q.type === 'multimodal' && q.multimodalResponseType === 'essay')
  ) || [];

  // Filter completed sessions for this quiz
  const quizSessions = sessions.filter(
    s => s.quizId === selectedQuizId && (s.status === 'submitted' || s.status === 'force_submitted')
  );

  // Default to first session if none selected
  const currentSession = quizSessions.find(s => s.id === selectedSessionId) || quizSessions[0];

  const handleSelectSession = (s: StudentSession) => {
    setSelectedSessionId(s.id);
    setIsSuccessMessage(false);
    // Prepopulate inputs from session answers
    const initScores: Record<string, number> = {};
    const initNotes: Record<string, string> = {};
    essayQuestions.forEach(q => {
      const ans = s.answers[q.id];
      if (ans && ans.manualScore !== undefined) {
        initScores[q.id] = ans.manualScore;
      } else {
        initScores[q.id] = 0;
      }
      if (ans && ans.notes) {
        initNotes[q.id] = ans.notes;
      }
    });
    setScoresInput(initScores);
    setNotesInput(initNotes);
  };

  const handleSaveGrading = () => {
    if (!currentSession || !activeQuiz) return;

    const updatedAnswers = { ...currentSession.answers };
    essayQuestions.forEach(q => {
      const score = Math.min(q.points, Math.max(0, scoresInput[q.id] || 0));
      const note = notesInput[q.id] || '';
      updatedAnswers[q.id] = {
        ...(updatedAnswers[q.id] || { questionId: q.id, type: 'essay', value: '', savedAt: new Date().toISOString() }),
        manualScore: score,
        isGraded: true,
        notes: note,
      };
    });

    const updatedSession: StudentSession = {
      ...currentSession,
      answers: updatedAnswers,
    };

    // Calculate final scores
    const evaluated = db.calculateFinalScores(updatedSession);
    db.saveSession(evaluated);
    setIsSuccessMessage(true);
    onRefresh();
    setTimeout(() => setIsSuccessMessage(false), 3000);
  };

  if (essayQuestions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
        <FileCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-white">Tidak Ada Soal Uraian Panjang</h3>
        <p className="text-xs text-slate-400 mt-1">
          Kuis yang dipilih hanya berisi soal otomatis (Pilihan Ganda, Menjodohkan, atau Uraian Singkat).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quiz Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">
            Penilaian Manual Soal Uraian / Esai
          </h3>
          <p className="text-xs text-slate-400">
            Periksa jawaban narasi siswa berdasarkan rubrik dan berikan skor serta catatan evaluasi.
          </p>
        </div>

        <select
          value={selectedQuizId}
          onChange={(e) => {
            setSelectedQuizId(e.target.value);
            setSelectedSessionId('');
          }}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-300 focus:outline-none"
        >
          {quizzes.map(q => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
      </div>

      {quizSessions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
          <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">Belum ada siswa yang mengumpulkan kuis ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Student List to Grade */}
          <div className="lg:col-span-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
              Daftar Siswa ({quizSessions.length})
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {quizSessions.map(s => {
                const isSelected = currentSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold truncate">{s.studentName}</div>
                      <div className="text-[11px] text-slate-400">
                        NIS: {s.studentNis} • {s.studentClass}
                      </div>
                    </div>
                    <div>
                      {s.isFullyGraded ? (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                          Sudah Dinilai
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-medium animate-pulse">
                          Perlu Dinilai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Grading Sheet */}
          {currentSession && (
            <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Lembar Jawaban: {currentSession.studentName} ({currentSession.studentClass})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Nilai otomatis sebelumnya: {currentSession.totalScore} poin
                  </p>
                </div>

                {isSuccessMessage && (
                  <span className="text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tersimpan
                  </span>
                )}
              </div>

              {/* Essay Questions Loop */}
              <div className="space-y-6">
                {essayQuestions.map((q, qIdx) => {
                  const studentAns = currentSession.answers[q.id]?.value || '';
                  const maxPoints = q.points;
                  const currentScore = scoresInput[q.id] ?? (currentSession.answers[q.id]?.manualScore || 0);
                  const currentNote = notesInput[q.id] ?? (currentSession.answers[q.id]?.notes || '');

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      {/* Question Stem */}
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {qIdx + 1}
                        </span>
                        <div>
                          <div className="text-[11px] text-rose-400 font-semibold uppercase">
                            Soal Uraian Panjang (Maks {maxPoints} Poin)
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 mt-0.5 leading-relaxed">
                            {q.text}
                          </p>

                          {q.media && q.media.length > 0 && (
                            <MultimodalViewer media={q.media} />
                          )}
                        </div>
                      </div>

                      {/* Rubric Guidance */}
                      {q.essayRubric && (
                        <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-300 flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Rubrik Penilaian Guru:</strong> {q.essayRubric}
                          </div>
                        </div>
                      )}

                      {/* Student's Typed Answer */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Jawaban Siswa:
                        </span>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                          {studentAns || <em className="text-slate-600">Siswa tidak mengisi jawaban.</em>}
                        </div>
                      </div>

                      {/* Input Score & Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900">
                        <div className="sm:col-span-1 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Beri Skor (0 - {maxPoints}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={maxPoints}
                            value={currentScore}
                            onChange={(e) => setScoresInput(prev => ({
                              ...prev,
                              [q.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Catatan / Feedback untuk Siswa:
                          </label>
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => setNotesInput(prev => ({
                              ...prev,
                              [q.id]: e.target.value
                            }))}
                            placeholder="Contoh: Argumen poin 2 perlu dielaborasi..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Grading Button */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveGrading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-900/40 flex items-center gap-2 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Finalisasi Nilai Siswa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
