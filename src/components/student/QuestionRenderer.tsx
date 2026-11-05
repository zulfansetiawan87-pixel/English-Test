/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question, StudentAnswer } from '../../types';
import { MultimodalViewer } from '../common/MultimodalViewer';
import {
  Check,
  CheckSquare,
  Square,
  Link2,
  HelpCircle,
  Sparkles,
  Image,
  Headphones,
  Video,
  FileText,
  Info
} from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  currentAnswer?: StudentAnswer;
  onAnswerChange: (value: any) => void;
  disabled?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}) => {
  // Matching local state
  const selectedMatchingPairs: Record<string, string> = currentAnswer?.value || {};
  const [activePremiseId, setActivePremiseId] = useState<string | null>(null);

  // Helper badge for attached media
  const renderMediaBadges = () => {
    if (!question.media || question.media.length === 0) return null;
    const hasImage = question.media.some(m => m.type === 'image');
    const hasAudio = question.media.some(m => m.type === 'audio');
    const hasVideo = question.media.some(m => m.type === 'video');

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {hasImage && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-medium">
            <Image className="w-3 h-3 text-blue-400" />
            <span>Gambar</span>
          </span>
        )}
        {hasAudio && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-medium animate-pulse">
            <Headphones className="w-3 h-3 text-indigo-400" />
            <span>Audio Listening</span>
          </span>
        )}
        {hasVideo && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-medium">
            <Video className="w-3 h-3 text-rose-400" />
            <span>Video</span>
          </span>
        )}
      </div>
    );
  };

  // 1. Multiple Choice (Single Choice)
  if (question.type === 'multiple_choice') {
    const selectedOptId = currentAnswer?.value as string | undefined;
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
              {questionNumber}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Pilihan Ganda Biasa</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </p>

              {/* Render Media Stimulus if attached */}
              {question.media && question.media.length > 0 && (
                <MultimodalViewer media={question.media} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {question.options?.map((opt, idx) => {
            const isSelected = selectedOptId === opt.id;
            const letter = optionLetters[idx] || `${idx + 1}`;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onAnswerChange(opt.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group select-none ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-500'
                    : 'bg-slate-800/50 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.99]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/80 text-slate-300 group-hover:bg-slate-600'
                  }`}
                >
                  {letter}
                </div>
                <div className="flex-1 text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                  {opt.text}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Complex Multiple Choice (Multi-select)
  if (question.type === 'complex_multiple_choice') {
    const selectedIds: string[] = Array.isArray(currentAnswer?.value) ? currentAnswer.value : [];
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    const toggleOption = (id: string) => {
      if (disabled) return;
      if (selectedIds.includes(id)) {
        onAnswerChange(selectedIds.filter(item => item !== id));
      } else {
        onAnswerChange([...selectedIds, id]);
      }
    };

    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              {questionNumber}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Pilihan Ganda Kompleks (Multi-Pilihan)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </p>
              <div className="mt-2 text-xs text-indigo-300 font-medium bg-indigo-950/50 px-2.5 py-1 rounded-md inline-block border border-indigo-800/50">
                Pilih satu atau lebih jawaban yang tepat ({selectedIds.length} dipilih)
              </div>

              {/* Render Media Stimulus if attached */}
              {question.media && question.media.length > 0 && (
                <MultimodalViewer media={question.media} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {question.options?.map((opt, idx) => {
            const isSelected = selectedIds.includes(opt.id);
            const letter = optionLetters[idx] || `${idx + 1}`;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleOption(opt.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group select-none ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-900/30 ring-1 ring-indigo-500'
                    : 'bg-slate-800/50 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.99]'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0 text-indigo-400">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-400 fill-indigo-600/20" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                  )}
                </div>
                <div className="w-6 h-6 rounded-md bg-slate-700/80 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {letter}
                </div>
                <div className="flex-1 text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                  {opt.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Matching / Mengelompokkan
  if (question.type === 'matching') {
    const pairs = question.matchingPairs || [];
    const responses = Array.from(new Set(pairs.map(p => p.response)));

    const handleSelectPremise = (pId: string) => {
      if (disabled) return;
      setActivePremiseId(activePremiseId === pId ? null : pId);
    };

    const handlePairWithResponse = (respText: string) => {
      if (!activePremiseId || disabled) return;
      const updated = {
        ...selectedMatchingPairs,
        [activePremiseId]: respText,
      };
      onAnswerChange(updated);
      setActivePremiseId(null);
    };

    const handleClearPair = (pId: string) => {
      if (disabled) return;
      const updated = { ...selectedMatchingPairs };
      delete updated[pId];
      onAnswerChange(updated);
    };

    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm">
              {questionNumber}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Soal Menjodohkan / Mengelompokkan</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </p>
              <p className="mt-1 text-xs text-teal-300">
                Cara menjawab: Ketuk pernyataan di kolom kiri (Premis), lalu ketuk pasangannya di kolom kanan.
              </p>

              {/* Render Media Stimulus if attached */}
              {question.media && question.media.length > 0 && (
                <MultimodalViewer media={question.media} />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kolom Kiri: Premis */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Kolom Pernyataan / Konsep:
            </div>
            {pairs.map(p => {
              const isActive = activePremiseId === p.id;
              const currentMatch = selectedMatchingPairs[p.id];

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPremise(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left select-none relative ${
                    isActive
                      ? 'bg-teal-600/20 border-teal-400 ring-2 ring-teal-500/50 text-white'
                      : currentMatch
                      ? 'bg-slate-800/90 border-teal-500/50 text-slate-200'
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-teal-400 mb-1 flex items-center justify-between">
                    <span>{p.premise}</span>
                    {currentMatch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearPair(p.id);
                        }}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  {currentMatch ? (
                    <div className="text-xs bg-slate-900/80 border border-teal-500/40 rounded-lg p-2 text-teal-200 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <span className="line-clamp-2">{currentMatch}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      {isActive ? '👉 Pilih jawaban di kolom kanan...' : 'Ketuk untuk menjodohkan'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Pilihan Pasangan */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Kolom Pilihan Jawaban:
            </div>
            {responses.map((resp, idx) => (
              <button
                key={idx}
                type="button"
                disabled={disabled || !activePremiseId}
                onClick={() => handlePairWithResponse(resp)}
                className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition select-none ${
                  activePremiseId
                    ? 'bg-slate-800 border-teal-500/70 hover:bg-teal-900/30 hover:border-teal-400 text-slate-100 cursor-pointer shadow-sm animate-pulse'
                    : 'bg-slate-800/30 border-slate-700/60 text-slate-400 cursor-not-allowed'
                }`}
              >
                {resp}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Short Answer (Uraian Singkat)
  if (question.type === 'short_answer') {
    const value = (currentAnswer?.value as string) || '';

    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              {questionNumber}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Uraian Singkat (Isian)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </p>

              {/* Render Media Stimulus if attached */}
              {question.media && question.media.length > 0 && (
                <MultimodalViewer media={question.media} />
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-medium text-slate-300 block">
            Ketikkan jawaban singkat Anda (tidak sensitif huruf besar/kecil):
          </label>
          <input
            type="text"
            disabled={disabled}
            value={value}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Ketik jawaban di sini..."
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <p className="text-[11px] text-slate-400">
            * Jawaban akan dicocokkan otomatis oleh sistem kuis secara cerdas.
          </p>
        </div>
      </div>
    );
  }

  // 5. Essay / Uraian Panjang
  if (question.type === 'essay') {
    const value = (currentAnswer?.value as string) || '';
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

    return (
      <div className="space-y-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
              {questionNumber}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Uraian Panjang (Esai)</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>
              <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </p>

              {/* Render Media Stimulus if attached */}
              {question.media && question.media.length > 0 && (
                <MultimodalViewer media={question.media} />
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tuliskan uraian argumen atau penjelasan Anda secara lengkap:</span>
            <span className="text-slate-400 font-mono">{wordCount} kata</span>
          </div>
          <textarea
            rows={7}
            disabled={disabled}
            value={value}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Jelaskan secara runtut, jelas, dan argumentatif..."
            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 leading-relaxed resize-y"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Soal esai akan diperiksa dan dinilai secara manual oleh guru mata pelajaran.</span>
          </div>
        </div>
      </div>
    );
  }

  // 6. TEKS MULTIMODAL (Dedicated Multimodal Question Type)
  if (question.type === 'multimodal') {
    const responseType = question.multimodalResponseType || (question.options && question.options.length > 0 ? 'multiple_choice' : 'essay');
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    return (
      <div className="space-y-4">
        {/* Multimodal Stimulus Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-950/60">
              {questionNumber}
            </span>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Teks / Soal Multimodal
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400 font-mono">{question.points} Poin</span>
                </div>
                {renderMediaBadges()}
              </div>

              {/* Stimulus Passage / Reading Text */}
              <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-wrap select-none">
                {question.text}
              </div>

              {/* Multimedia Player (Gambar, Audio, Video) */}
              {question.media && question.media.length > 0 ? (
                <MultimodalViewer media={question.media} />
              ) : (
                <div className="p-3 my-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Media stimulus multimodal sedang dipersiapkan oleh guru penguji.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Response Area for Multimodal */}
        <div className="space-y-2">
          {/* Sub-header instruksi respon */}
          <div className="text-xs font-semibold text-slate-300 px-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {responseType === 'multiple_choice' && 'Pilihlah salah satu jawaban yang paling tepat berdasarkan media di atas:'}
              {responseType === 'complex_multiple_choice' && 'Pilihlah satu atau lebih pernyataan yang sesuai dengan stimulus di atas:'}
              {responseType === 'short_answer' && 'Tuliskan jawaban singkat Anda berdasarkan pengamatan media di atas:'}
              {responseType === 'essay' && 'Tuliskan analisis atau penjelasan komprehensif Anda berdasarkan materi stimulus:'}
            </span>
          </div>

          {/* Response Type A: Multiple Choice */}
          {responseType === 'multiple_choice' && (
            <div className="space-y-2.5">
              {question.options?.map((opt, idx) => {
                const isSelected = currentAnswer?.value === opt.id;
                const letter = optionLetters[idx] || `${idx + 1}`;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAnswerChange(opt.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group select-none ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-900/30 ring-1 ring-indigo-500'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.99]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700/80 text-slate-300 group-hover:bg-slate-600'
                      }`}
                    >
                      {letter}
                    </div>
                    <div className="flex-1 text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                      {opt.text}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Response Type B: Complex Multiple Choice */}
          {responseType === 'complex_multiple_choice' && (
            <div className="space-y-2.5">
              {question.options?.map((opt, idx) => {
                const selectedIds: string[] = Array.isArray(currentAnswer?.value) ? currentAnswer.value : [];
                const isSelected = selectedIds.includes(opt.id);
                const letter = optionLetters[idx] || `${idx + 1}`;

                const toggleComplex = () => {
                  if (disabled) return;
                  if (isSelected) {
                    onAnswerChange(selectedIds.filter(item => item !== opt.id));
                  } else {
                    onAnswerChange([...selectedIds, opt.id]);
                  }
                };

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={toggleComplex}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 group select-none ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-900/30 ring-1 ring-indigo-500'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.99]'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 text-indigo-400">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-400 fill-indigo-600/20" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                      )}
                    </div>
                    <div className="w-6 h-6 rounded-md bg-slate-700/80 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {letter}
                    </div>
                    <div className="flex-1 text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Response Type C: Short Answer */}
          {responseType === 'short_answer' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
              <input
                type="text"
                disabled={disabled}
                value={(currentAnswer?.value as string) || ''}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Ketik jawaban singkat pengamatan..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Response Type D: Essay */}
          {responseType === 'essay' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
              <textarea
                rows={7}
                disabled={disabled}
                value={(currentAnswer?.value as string) || ''}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Tuliskan analisis mendalam berdasarkan media..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
