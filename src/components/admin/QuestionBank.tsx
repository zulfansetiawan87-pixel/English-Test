/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Question, Quiz, QuestionType } from '../../types';
import { db } from '../../services/db';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Tag,
  CheckCircle2,
  Share2,
  HelpCircle,
  X,
  Image,
  Headphones,
  Video,
  Sparkles
} from 'lucide-react';

interface QuestionBankProps {
  quizzes: Quiz[];
  onRefresh: () => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  quizzes,
  onRefresh,
}) => {
  const [bankQuestions, setBankQuestions] = useState<Question[]>(db.getQuestionBank());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [targetQuizModal, setTargetQuizModal] = useState<Question | null>(null);
  const [selectedTargetQuizId, setSelectedTargetQuizId] = useState<string>(quizzes[0]?.id || '');
  const [copySuccess, setCopySuccess] = useState(false);

  const filteredQuestions = useMemo(() => {
    return bankQuestions.filter(q => {
      const matchSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'all' || q.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [bankQuestions, searchTerm, typeFilter]);

  const handleDelete = (id: string) => {
    if (confirm('Hapus soal ini dari Bank Soal?')) {
      db.deleteQuestionFromBank(id);
      setBankQuestions(db.getQuestionBank());
      onRefresh();
    }
  };

  const handleCopyToQuiz = () => {
    if (!targetQuizModal || !selectedTargetQuizId) return;
    const targetQuiz = db.getQuizById(selectedTargetQuizId);
    if (!targetQuiz) return;

    const cloned: Question = {
      ...targetQuizModal,
      id: 'cloned-q-' + Date.now(),
      quizId: targetQuiz.id,
    };

    targetQuiz.questions.push(cloned);
    db.saveQuiz(targetQuiz);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
      setTargetQuizModal(null);
      onRefresh();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-heading">
            Bank Soal Master ({bankQuestions.length} Butir)
          </h3>
          <p className="text-xs text-slate-400">
            Kumpulan bank soal terpusat yang dapat digunakan kembali untuk berbagai ujian sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari materi / teks soal..."
              className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
          >
            <option value="all">Semua Tipe Soal</option>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="complex_multiple_choice">PG Kompleks</option>
            <option value="multimodal">🌟 Teks Multimodal</option>
            <option value="matching">Menjodohkan</option>
            <option value="short_answer">Uraian Singkat</option>
            <option value="essay">Uraian Panjang</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">Tidak ada soal dalam bank yang sesuai dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full font-mono ${
                      q.type === 'multimodal'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'text-blue-400 bg-blue-950/80 border border-blue-800/60'
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
                    {q.subject && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        {q.subject}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-amber-400">{q.points} Poin</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3">
                  {q.text}
                </p>

                {/* Option summary if MC */}
                {q.options && (
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    {q.options.slice(0, 2).map((opt, oIdx) => (
                      <div key={opt.id} className="truncate">
                        • {String.fromCharCode(65 + oIdx)}. {opt.text}
                      </div>
                    ))}
                    {q.options.length > 2 && (
                      <div className="text-slate-500 italic">+ {q.options.length - 2} opsi lainnya...</div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setTargetQuizModal(q)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                  title="Salin soal ini ke salah satu Kuis Aktif"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin ke Kuis</span>
                </button>

                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Hapus dari Bank Soal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Copy to Quiz */}
      {targetQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-400" />
                Salin Butir Soal ke Kuis
              </h3>
              <button
                onClick={() => setTargetQuizModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 line-clamp-2 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              "{targetQuizModal.text}"
            </p>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Pilih Kuis Sasaran:</label>
              <select
                value={selectedTargetQuizId}
                onChange={(e) => setSelectedTargetQuizId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questions.length} Soal)
                  </option>
                ))}
              </select>
            </div>

            {copySuccess && (
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-center font-medium">
                ✓ Soal berhasil disalin ke kuis!
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setTargetQuizModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                onClick={handleCopyToQuiz}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
              >
                Salin Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
