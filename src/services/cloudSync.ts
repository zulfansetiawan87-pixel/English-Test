/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quiz, Question, TeacherAccount, StudentSession } from '../types';

export interface CloudSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncCallback = (status: CloudSyncStatus) => void;
type DataChangeCallback = () => void;

class CloudSyncService {
  private status: CloudSyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
  };

  private statusListeners: Set<SyncCallback> = new Set();
  private dataChangeListeners: Set<DataChangeCallback> = new Set();
  private autoSyncInterval: any = null;
  private lastKnownServerUpdate: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.status.isOnline = true;
        this.notifyStatus();
        this.pullFromCloud();
      });

      window.addEventListener('offline', () => {
        this.status.isOnline = false;
        this.notifyStatus();
      });

      // Sync when tab regains visibility (e.g. teacher switched tabs or returned to laptop)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.pullFromCloud();
        }
      });

      // Periodic auto-sync every 15 seconds
      this.autoSyncInterval = setInterval(() => {
        this.pullFromCloud();
      }, 15000);
    }
  }

  public subscribeStatus(cb: SyncCallback): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  public subscribeDataChange(cb: DataChangeCallback): () => void {
    this.dataChangeListeners.add(cb);
    return () => this.dataChangeListeners.delete(cb);
  }

  private notifyStatus() {
    this.statusListeners.forEach(cb => {
      try {
        cb({ ...this.status });
      } catch (e) {
        console.error('Error in status listener', e);
      }
    });
  }

  private notifyDataChange() {
    this.dataChangeListeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error in data change listener', e);
      }
    });
  }

  /**
   * Fetch full state from Cloud Server and merge with local database
   */
  public async pullFromCloud(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      this.status.isSyncing = true;
      this.notifyStatus();

      const res = await fetch('/api/cloud-sync', {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.success) {
        const { quizzes, questionBank, teachers, sessions, lastUpdated } = data;

        // Import db dynamically to avoid circular dependency
        const { db } = await import('./db');
        const hasChanges = db.mergeCloudData({
          quizzes,
          questionBank,
          teachers,
          sessions
        });

        this.status.isOnline = true;
        this.status.lastSyncedAt = new Date();
        this.status.lastError = null;
        this.lastKnownServerUpdate = lastUpdated;

        if (hasChanges) {
          this.notifyDataChange();
        }
        return true;
      }
      return false;
    } catch (err: any) {
      this.status.lastError = err.message || 'Gagal terhubung ke cloud server';
      return false;
    } finally {
      this.status.isSyncing = false;
      this.notifyStatus();
    }
  }

  /**
   * Save a single quiz to the cloud server
   */
  public async pushQuiz(quiz: Quiz): Promise<boolean> {
    try {
      this.status.isSyncing = true;
      this.notifyStatus();

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      });

      if (res.ok) {
        this.status.lastSyncedAt = new Date();
        this.status.lastError = null;
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Gagal push quiz ke cloud:', err);
      this.status.lastError = err.message;
      return false;
    } finally {
      this.status.isSyncing = false;
      this.notifyStatus();
    }
  }

  /**
   * Delete quiz from cloud server
   */
  public async deleteQuiz(quizId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal delete quiz di cloud:', err);
      return false;
    }
  }

  /**
   * Save teacher to cloud server
   */
  public async pushTeacher(teacher: TeacherAccount): Promise<boolean> {
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher)
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal push teacher ke cloud:', err);
      return false;
    }
  }

  /**
   * Delete teacher from cloud server
   */
  public async deleteTeacher(teacherId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal delete teacher di cloud:', err);
      return false;
    }
  }

  /**
   * Save question to bank in cloud server
   */
  public async pushQuestionToBank(question: Question): Promise<boolean> {
    try {
      const res = await fetch('/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal push question ke bank cloud:', err);
      return false;
    }
  }

  /**
   * Delete question from bank in cloud server
   */
  public async deleteQuestionFromBank(questionId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/question-bank/${encodeURIComponent(questionId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal delete question di bank cloud:', err);
      return false;
    }
  }

  /**
   * Save student session to cloud server
   */
  public async pushSession(session: StudentSession): Promise<boolean> {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      return res.ok;
    } catch (err) {
      console.warn('Gagal push session ke cloud:', err);
      return false;
    }
  }

  /**
   * Force full push from local data to cloud
   */
  public async pushFullState(state: {
    quizzes: Quiz[];
    questionBank: Question[];
    teachers: TeacherAccount[];
    sessions: StudentSession[];
  }): Promise<boolean> {
    try {
      this.status.isSyncing = true;
      this.notifyStatus();

      const res = await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });

      if (res.ok) {
        this.status.lastSyncedAt = new Date();
        this.status.lastError = null;
        return true;
      }
      return false;
    } catch (err: any) {
      this.status.lastError = err.message;
      return false;
    } finally {
      this.status.isSyncing = false;
      this.notifyStatus();
    }
  }
}

export const cloudSync = new CloudSyncService();
