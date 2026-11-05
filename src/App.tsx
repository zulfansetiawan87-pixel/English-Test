/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Quiz, StudentSession } from './types';
import { db } from './services/db';
import { StudentLogin } from './components/student/StudentLogin';
import { ExamRoom } from './components/student/ExamRoom';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { KioskDocModal } from './components/KioskDocModal';
import { OfflineIndicator } from './components/OfflineIndicator';

type ViewState = 'student_login' | 'student_exam' | 'admin_login' | 'admin_dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('student_login');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeSession, setActiveSession] = useState<StudentSession | null>(null);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);

  // Check for any ongoing session on page mount
  useEffect(() => {
    try {
      const storedLastSessionId = localStorage.getItem('secureexam_active_session_id');
      if (storedLastSessionId) {
        const session = db.getSessionById(storedLastSessionId);
        if (session && session.status === 'in_progress') {
          const quiz = db.getQuizById(session.quizId);
          if (quiz) {
            setActiveQuiz(quiz);
            setActiveSession(session);
            setCurrentView('student_exam');
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleStartExam = (quiz: Quiz, session: StudentSession) => {
    setActiveQuiz(quiz);
    setActiveSession(session);
    localStorage.setItem('secureexam_active_session_id', session.id);
    setCurrentView('student_exam');
  };

  const handleFinishExam = (updatedSession: StudentSession) => {
    setActiveSession(updatedSession);
    localStorage.removeItem('secureexam_active_session_id');
  };

  const handleExitToPortal = () => {
    setActiveQuiz(null);
    setActiveSession(null);
    localStorage.removeItem('secureexam_active_session_id');
    setCurrentView('student_login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Student Login & Quiz Selection Portal */}
      {currentView === 'student_login' && (
        <StudentLogin
          onStartExam={handleStartExam}
          onSwitchToAdmin={() => setCurrentView('admin_login')}
          onOpenKioskDoc={() => setIsKioskModalOpen(true)}
        />
      )}

      {/* 2. Fullscreen Active Exam Room for Student */}
      {currentView === 'student_exam' && activeQuiz && activeSession && (
        <ExamRoom
          quiz={activeQuiz}
          session={activeSession}
          onFinishExam={handleFinishExam}
          onExitToPortal={handleExitToPortal}
        />
      )}

      {/* 3. Teacher / Proctor Login */}
      {currentView === 'admin_login' && (
        <AdminLogin
          onLoginSuccess={() => setCurrentView('admin_dashboard')}
          onBackToStudent={() => setCurrentView('student_login')}
        />
      )}

      {/* 4. Complete Teacher Admin Dashboard */}
      {currentView === 'admin_dashboard' && (
        <AdminDashboard
          onLogout={() => setCurrentView('student_login')}
          onOpenStudentPortal={() => setCurrentView('student_login')}
        />
      )}

      {/* Global Kiosk Documentation & Native APK Modal */}
      <KioskDocModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
      />

      {/* PWA Offline Network Banner */}
      <OfflineIndicator />
    </div>
  );
}
