/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { QuestionMedia } from '../../types';
import {
  Image,
  Headphones,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ZoomIn
} from 'lucide-react';

interface MultimodalViewerProps {
  media: QuestionMedia[];
  title?: string;
  allowZoom?: boolean;
}

export const MultimodalViewer: React.FC<MultimodalViewerProps> = ({
  media,
  title,
  allowZoom = true,
}) => {
  const [activeMediaId, setActiveMediaId] = useState<string>(media[0]?.id || '');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset active media if media list changes
  useEffect(() => {
    if (media.length > 0 && !media.some(m => m.id === activeMediaId)) {
      setActiveMediaId(media[0].id);
    }
  }, [media, activeMediaId]);

  const activeItem = media.find(m => m.id === activeMediaId) || media[0];
  if (!activeItem) return null;

  // Audio controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setAudioCurrentTime(cur);
    setAudioProgress((cur / dur) * 100);
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration || 0);
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const pct = parseFloat(e.target.value);
    const dur = audioRef.current.duration || 1;
    const newTime = (pct / 100) * dur;
    audioRef.current.currentTime = newTime;
    setAudioProgress(pct);
    setAudioCurrentTime(newTime);
  };

  const handleCycleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 my-3">
      {/* Media Selector Tabs (If multiple items attached) */}
      {media.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-700/60">
          {media.map((m, idx) => {
            const isSelected = m.id === activeMediaId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMediaId(m.id);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlayingAudio(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.type === 'image' && <Image className="w-3.5 h-3.5" />}
                {m.type === 'audio' && <Headphones className="w-3.5 h-3.5" />}
                {m.type === 'video' && <Video className="w-3.5 h-3.5" />}
                <span>
                  {m.title || `${m.type === 'image' ? 'Gambar' : m.type === 'audio' ? 'Audio' : 'Video'} #${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Active Media Presentation */}
      <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-750 shadow-lg">
        {/* IMAGE DISPLAY */}
        {activeItem.type === 'image' && (
          <div className="relative group bg-slate-950 flex flex-col items-center">
            <div
              className="relative max-h-[380px] w-full overflow-hidden flex items-center justify-center p-2 cursor-pointer"
              onClick={() => allowZoom && setLightboxImage(activeItem.url)}
            >
              <img
                src={activeItem.url}
                alt={activeItem.title || 'Stimulus Gambar Soal'}
                className="max-h-[360px] w-auto max-w-full rounded-xl object-contain shadow-md transition-transform duration-200 group-hover:scale-[1.01]"
              />

              {allowZoom && (
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-xs text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-lg flex items-center gap-1 text-xs font-medium">
                  <ZoomIn className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Perbesar Gambar</span>
                </div>
              )}
            </div>

            {/* Caption / Title */}
            {(activeItem.title || activeItem.caption) && (
              <div className="w-full p-3 bg-slate-900/95 border-t border-slate-800 text-xs">
                {activeItem.title && (
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-blue-400" />
                    <span>{activeItem.title}</span>
                  </div>
                )}
                {activeItem.caption && (
                  <p className="text-slate-300 text-[11px] mt-0.5 italic">
                    {activeItem.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* AUDIO PLAYER */}
        {activeItem.type === 'audio' && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-l-4 border-l-indigo-500">
            <audio
              ref={audioRef}
              src={activeItem.url}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={handleAudioLoadedMetadata}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            <div className="space-y-3">
              {/* Header Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
                    <Headphones className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-white">
                      {activeItem.title || 'Audio Stimulus / Listening'}
                    </h5>
                    <p className="text-[11px] text-indigo-300">
                      {activeItem.caption || 'Dengarkan rekaman audio berikut dengan saksama untuk menjawab soal.'}
                    </p>
                  </div>
                </div>

                {/* Animated Audio Equalizer Bars when playing */}
                <div className="flex items-end gap-1 h-5 px-2">
                  <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-150 ${isPlayingAudio ? 'h-5 animate-pulse' : 'h-1.5'}`}></span>
                  <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-150 ${isPlayingAudio ? 'h-3 animate-pulse delay-75' : 'h-2'}`}></span>
                  <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-150 ${isPlayingAudio ? 'h-4 animate-pulse delay-150' : 'h-1.5'}`}></span>
                  <span className={`w-1 bg-indigo-400 rounded-full transition-all duration-150 ${isPlayingAudio ? 'h-5 animate-pulse delay-100' : 'h-2.5'}`}></span>
                </div>
              </div>

              {/* Progress Slider Bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={audioProgress || 0}
                  onChange={handleAudioSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{formatSeconds(audioCurrentTime)}</span>
                  <span>{formatSeconds(audioDuration)}</span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/50 transition active:scale-95"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Jeda Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Putar Audio</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!audioRef.current) return;
                      audioRef.current.currentTime = 0;
                      setAudioProgress(0);
                      setAudioCurrentTime(0);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Ulangi dari Awal"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCycleSpeed}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 text-[11px] font-mono font-semibold border border-slate-700 transition"
                    title="Kecepatan Pemutaran"
                  >
                    {playbackRate}x
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!audioRef.current) return;
                      audioRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title={isMuted ? 'Nyalakan Suara' : 'Senyap'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO PLAYER */}
        {activeItem.type === 'video' && (
          <div className="bg-slate-950 flex flex-col">
            <div className="relative aspect-video w-full bg-black rounded-t-xl overflow-hidden flex items-center justify-center">
              {activeItem.url.includes('youtube.com') || activeItem.url.includes('youtu.be') ? (
                <iframe
                  src={activeItem.url.replace('watch?v=', 'embed/')}
                  title={activeItem.title || 'Video Stimulus'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  controls
                  playsInline
                  src={activeItem.url}
                  className="w-full h-full max-h-[420px] object-contain"
                >
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              )}
            </div>

            {(activeItem.title || activeItem.caption) && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs">
                {activeItem.title && (
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    <span>{activeItem.title}</span>
                  </div>
                )}
                {activeItem.caption && (
                  <p className="text-slate-300 text-[11px] mt-0.5 italic">
                    {activeItem.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal for Images */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
              title="Tutup Pratinjau Gambar"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Perbesaran Gambar Soal"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
