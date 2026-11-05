/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QuestionMedia, MediaType } from '../../types';
import {
  Image,
  Headphones,
  Video,
  UploadCloud,
  Link,
  Trash2,
  Plus,
  Sparkles,
  Info,
  CheckCircle2,
  FileAudio,
  Film,
  FileImage,
  Play
} from 'lucide-react';

interface MediaUploaderProps {
  mediaList: QuestionMedia[];
  onChange: (updatedMedia: QuestionMedia[]) => void;
}

// Built-in presets for quick demonstration
const PRESET_IMAGE_DIAGRAM = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80';
const PRESET_IMAGE_MAP = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80';
// Synthetic audible data URL for sample listening
const SAMPLE_AUDIO_URL = 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  mediaList,
  onChange,
}) => {
  const [activeType, setActiveType] = useState<MediaType>('image');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    // Check reasonable size limit for local storage
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran berkas melebihi 15MB. Gunakan file yang lebih ringkas atau masukkan link URL eksternal.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newMedia: QuestionMedia = {
        id: 'media-' + Date.now(),
        type: activeType,
        url: dataUrl,
        title: mediaTitle.trim() || file.name,
        caption: mediaCaption.trim() || undefined,
        fileName: file.name,
      };

      onChange([...mediaList, newMedia]);
      setMediaTitle('');
      setMediaCaption('');
      setIsProcessing(false);
      e.target.value = '';
    };

    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas media.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleAddFromUrl = () => {
    if (!urlInput.trim()) return;

    const newMedia: QuestionMedia = {
      id: 'media-' + Date.now(),
      type: activeType,
      url: urlInput.trim(),
      title: mediaTitle.trim() || `${activeType === 'image' ? 'Gambar' : activeType === 'audio' ? 'Audio' : 'Video'} Online`,
      caption: mediaCaption.trim() || undefined,
    };

    onChange([...mediaList, newMedia]);
    setUrlInput('');
    setMediaTitle('');
    setMediaCaption('');
  };

  const handleApplyPreset = (type: MediaType, presetUrl: string, defaultTitle: string, defaultCaption: string) => {
    const newMedia: QuestionMedia = {
      id: 'media-preset-' + Date.now(),
      type,
      url: presetUrl,
      title: defaultTitle,
      caption: defaultCaption,
    };
    onChange([...mediaList, newMedia]);
  };

  const handleRemoveMedia = (id: string) => {
    onChange(mediaList.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Media Multimodal Soal (Gambar, Suara / Audio, Video)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tambahkan media visual, rekaman audio listening, atau video pembelajaran sebagai stimulus soal.
          </p>
        </div>
        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
          {mediaList.length} Media Terlampir
        </span>
      </div>

      {/* Media Type Selector */}
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveType('image')}
          className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
            activeType === 'image'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Gambar (Foto/Diagram)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveType('audio')}
          className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
            activeType === 'audio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Suara / Audio Listening</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveType('video')}
          className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
            activeType === 'video'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Pembelajaran</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Input Form for Media Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">
            Judul / Label Media:
          </label>
          <input
            type="text"
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
            placeholder={
              activeType === 'image'
                ? 'Contoh: Diagram Alur Topologi Jaringan'
                : activeType === 'audio'
                ? 'Contoh: Audio Listening Section 1'
                : 'Contoh: Video Simulasi Praktikum'
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">
            Keterangan / Transkrip / Catatan:
          </label>
          <input
            type="text"
            value={mediaCaption}
            onChange={(e) => setMediaCaption(e.target.value)}
            placeholder="Petunjuk khusus untuk siswa saat menyimak..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
          />
        </div>
      </div>

      {/* Upload Zone & Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Option A: Upload Local File */}
        <div className="border border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-900/40 flex flex-col items-center justify-center transition">
          <UploadCloud className="w-7 h-7 text-blue-400 mb-1" />
          <span className="text-xs font-semibold text-white">Unggah Berkas dari Komputer</span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {activeType === 'image' && 'PNG, JPG, WEBP, GIF (Diagram, Peta, Bagan)'}
            {activeType === 'audio' && 'MP3, WAV, OGG, M4A (Rekaman Suara/Listening)'}
            {activeType === 'video' && 'MP4, WebM (Video Praktik / Eksperimen)'}
          </span>

          <label className="mt-2.5 inline-block px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-sm transition active:scale-95">
            <input
              type="file"
              accept={
                activeType === 'image'
                  ? 'image/*'
                  : activeType === 'audio'
                  ? 'audio/*'
                  : 'video/*'
              }
              onChange={handleFileUpload}
              className="hidden"
            />
            <span>{isProcessing ? 'Memproses...' : 'Pilih Berkas'}</span>
          </label>
        </div>

        {/* Option B: Input Media URL / Embed */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              <span>Gunakan Tautan URL / Embed Media</span>
            </div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={
                activeType === 'image'
                  ? 'https://example.com/diagram.jpg'
                  : activeType === 'audio'
                  ? 'https://example.com/audio.mp3'
                  : 'https://youtube.com/watch?v=... atau file .mp4'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
            />
          </div>

          <button
            type="button"
            disabled={!urlInput.trim()}
            onClick={handleAddFromUrl}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-blue-400 text-xs font-semibold transition"
          >
            Lampirkan Tautan URL
          </button>
        </div>
      </div>

      {/* Preset Quick Samples (Agar Guru Langsung Bisa Mencoba) */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Uji Coba Cepat (Gunakan Sampel Media Sekolah):</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {activeType === 'image' && (
            <>
              <button
                type="button"
                onClick={() => handleApplyPreset('image', PRESET_IMAGE_DIAGRAM, 'Diagram Server & Jaringan', 'Topologi arsitektur infrastruktur IT sekolah')}
                className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-[11px] hover:bg-blue-900 transition flex items-center gap-1"
              >
                <FileImage className="w-3 h-3" />
                <span>+ Sampel Gambar Diagram Jaringan</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('image', PRESET_IMAGE_MAP, 'Peta Persebaran Wilayah', 'Analisis geospasial lokasi asesmen')}
                className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 text-[11px] hover:bg-blue-900 transition flex items-center gap-1"
              >
                <FileImage className="w-3 h-3" />
                <span>+ Sampel Peta Geospasial</span>
              </button>
            </>
          )}

          {activeType === 'audio' && (
            <button
              type="button"
              onClick={() => handleApplyPreset('audio', SAMPLE_AUDIO_URL, 'Audio Percakapan Listening', 'Percakapan listening bahasa Inggris dialog 1')}
              className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] hover:bg-indigo-900 transition flex items-center gap-1"
            >
              <FileAudio className="w-3 h-3" />
              <span>+ Sampel Audio Suara Listening</span>
            </button>
          )}

          {activeType === 'video' && (
            <button
              type="button"
              onClick={() => handleApplyPreset('video', SAMPLE_VIDEO_URL, 'Video Simulasi Praktikum', 'Simulasi praktikum keamanan data dan konfigurasi')}
              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[11px] hover:bg-rose-900 transition flex items-center gap-1"
            >
              <Film className="w-3 h-3" />
              <span>+ Sampel Video Praktikum</span>
            </button>
          )}
        </div>
      </div>

      {/* List of Attached Media with Thumbnail & Delete */}
      {mediaList.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Daftar Media Terpasang pada Soal:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mediaList.map((m, idx) => (
              <div
                key={m.id || idx}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300">
                    {m.type === 'image' && <Image className="w-4 h-4 text-blue-400" />}
                    {m.type === 'audio' && <Headphones className="w-4 h-4 text-indigo-400" />}
                    {m.type === 'video' && <Video className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {m.title || `Media #${idx + 1}`}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {m.type.toUpperCase()} • {m.caption || (m.url.startsWith('data:') ? 'Berkas Unggahan Lokal' : m.url)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMedia(m.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition flex-shrink-0"
                  title="Hapus Media Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
