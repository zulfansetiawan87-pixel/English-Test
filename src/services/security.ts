/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SecurityStatus {
  isFullscreen: boolean;
  isPWA: boolean;
  isOnline: boolean;
  violationsCount: number;
  isLocked: boolean;
}

export function enterFullscreen(): Promise<void> {
  const elem = document.documentElement as any;
  if (elem.requestFullscreen) {
    return elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    return elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    return elem.msRequestFullscreen();
  }
  return Promise.resolve();
}

export function exitFullscreen(): Promise<void> {
  const doc = document as any;
  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  }
  return Promise.resolve();
}

export function isCurrentlyFullscreen(): boolean {
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Subtle audio alert beep using Web Audio API (no external asset needed)
export function playViolationBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Audio context might be restricted before interaction
  }
}
