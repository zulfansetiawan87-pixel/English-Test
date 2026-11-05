/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ViolationRecord } from '../types';
import { isCurrentlyFullscreen, enterFullscreen, playViolationBeep } from '../services/security';

interface UseExamSecurityOptions {
  active: boolean;
  maxViolations: number;
  currentQuestionNumber?: number;
  onViolation: (record: ViolationRecord) => void;
  onLockTriggered: () => void;
}

export function useExamSecurity({
  active,
  maxViolations,
  currentQuestionNumber = 1,
  onViolation,
  onLockTriggered,
}: UseExamSecurityOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationAlert, setViolationAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
    count: number;
  } | null>(null);

  const lastViolationTime = useRef<number>(0);
  const violationCountRef = useRef<number>(0);

  const handleViolation = useCallback((type: ViolationRecord['type'], message: string) => {
    if (!active) return;

    // Debounce multiple rapid events (e.g. blur + visibility hidden within 1 second)
    const now = Date.now();
    if (now - lastViolationTime.current < 1200) {
      return;
    }
    lastViolationTime.current = now;

    violationCountRef.current += 1;
    const currentCount = violationCountRef.current;

    playViolationBeep();

    const record: ViolationRecord = {
      id: 'viol-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type,
      message,
      questionNumber: currentQuestionNumber,
    };

    onViolation(record);

    if (currentCount >= maxViolations) {
      setViolationAlert({
        show: true,
        title: 'UJIAN DIKUNCI OLEH SISTEM',
        message: `Anda telah melakukan ${currentCount} pelanggaran. Batas toleransi telah terlampaui. Hubungi Pengawas / Guru untuk verifikasi.`,
        count: currentCount,
      });
      onLockTriggered();
    } else {
      setViolationAlert({
        show: true,
        title: `Peringatan Pelanggaran (${currentCount}/${maxViolations})`,
        message: `${message}. Harap tetap fokus pada lembar pengerjaan kuis!`,
        count: currentCount,
      });
    }
  }, [active, maxViolations, currentQuestionNumber, onViolation, onLockTriggered]);

  // Fullscreen change listener
  useEffect(() => {
    if (!active) return;

    const checkFullscreen = () => {
      const full = isCurrentlyFullscreen();
      setIsFullscreen(full);
      if (!full && active) {
        handleViolation('exit_fullscreen', 'Terdeteksi keluar dari mode Layar Penuh (Fullscreen)');
      }
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
    };
  }, [active, handleViolation]);

  // Visibility change & Blur listeners
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('visibility_hidden', 'Terdeteksi beralih ke tab peramban lain atau meminimalkan aplikasi');
      }
    };

    const handleWindowBlur = () => {
      // Small timeout to allow intentional UI interaction
      setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') return;
        if (!document.hasFocus()) {
          handleViolation('window_blur', 'Jendela ujian kehilangan fokus (indikasi membuka aplikasi eksternal atau split-screen)');
        }
      }, 200);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [active, handleViolation]);

  // Keyboard shortcut restrictions (F12, DevTools, Copy, Paste, PrintScreen)
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Inspect shortcuts
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        handleViolation('dev_tools', 'Mencoba membuka Developer Tools / Inspect Element');
        return;
      }

      // Copy / Cut / Paste
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        // Allow typing paste only inside essay textarea or short answer input if desired, but prevent copy
        if (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          handleViolation('copy_paste_attempt', 'Mencoba menyalin (copy/cut) teks soal ujian');
        }
      }

      // PrintScreen Key
      if (e.key === 'PrintScreen') {
        handleViolation('copy_paste_attempt', 'Mencoba mengambil tangkapan layar (PrintScreen)');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('context_menu', 'Klik kanan (Context Menu) dinonaktifkan demi keamanan');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('copy_paste_attempt', 'Tindakan menyalin teks diblokir oleh sistem ujian');
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [active, handleViolation]);

  const dismissViolationAlert = () => {
    setViolationAlert(null);
  };

  const requestFullscreenAgain = () => {
    enterFullscreen().catch(() => {});
    setViolationAlert(null);
  };

  return {
    isFullscreen,
    violationAlert,
    dismissViolationAlert,
    requestFullscreenAgain,
  };
}
