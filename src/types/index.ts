/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'student';

export type MediaType = 'image' | 'audio' | 'video';

export interface QuestionMedia {
  id: string;
  type: MediaType;
  url: string;        // Data URL (Base64) atau tautan URL eksternal
  title?: string;     // Judul media, misal "Audio Percakapan Listening"
  caption?: string;   // Keterangan / transkrip / instruksi media
  fileName?: string;  // Nama berkas asli
}

export type QuestionType =
  | 'multiple_choice'          // Pilihan Ganda biasa (1 jawaban benar)
  | 'complex_multiple_choice'  // Pilihan Ganda Kompleks (lebih dari 1 jawaban benar)
  | 'matching'                 // Mengelompokkan / Menjodohkan
  | 'short_answer'             // Uraian Singkat (auto matching kata kunci)
  | 'essay'                    // Uraian Panjang (penilaian manual oleh guru)
  | 'multimodal';              // Teks Multimodal (Stimulus Gambar, Suara/Audio, Video)

export interface OptionItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  id: string;
  premise: string;   // Pernyataan / Konsep di kolom kiri
  response: string;  // Pasangan / Jawaban di kolom kanan
}

export interface Question {
  id: string;
  quizId?: string;
  type: QuestionType;
  text: string;
  points: number;
  media?: QuestionMedia[];             // Media multimodal (gambar, audio, video)
  multimodalResponseType?: 'multiple_choice' | 'complex_multiple_choice' | 'short_answer' | 'essay'; // Tipe respon jawaban untuk teks multimodal
  options?: OptionItem[];              // Digunakan untuk multiple_choice, complex_multiple_choice, & multimodal PG
  correctAnswer?: string | string[];   // id atau array of id untuk pilihan ganda
  matchingPairs?: MatchingPair[];      // Untuk soal menjodohkan/mengelompokkan
  shortAnswerKeywords?: string[];      // Kata kunci yang diterima untuk uraian singkat (case insensitive)
  essayRubric?: string;                // Panduan / rubrik penilaian untuk guru
  explanation?: string;                // Pembahasan soal
  subject?: string;                    // Mata pelajaran
  topic?: string;                      // Topik / Bab
  difficulty?: 'mudah' | 'sedang' | 'sulit';
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  targetClasses: string[];            // Contoh: ['X RPL 1', 'X TKJ 1', 'Semua Kelas']
  description: string;
  durationMinutes: number;            // Durasi dalam menit
  startTime: string;                  // ISO String
  endTime: string;                    // ISO String
  token?: string;                     // Token masuk kuis, misal: "PAS2026"
  shuffleQuestions: boolean;          // Acak urutan soal
  shuffleOptions: boolean;            // Acak opsi jawaban (PG)
  showScoreAfterSubmit: boolean;      // Tampilkan nilai langsung ke murid setelah submit
  maxViolations: number;              // Batas pelanggaran sebelum terkunci otomatis (default: 3)
  questions: Question[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

export interface ViolationRecord {
  id: string;
  timestamp: string;
  type:
    | 'visibility_hidden'
    | 'window_blur'
    | 'exit_fullscreen'
    | 'copy_paste_attempt'
    | 'context_menu'
    | 'dev_tools'
    | 'split_screen_suspected';
  message: string;
  questionNumber?: number;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  value: any; // string (PG/Singkat), string[] (Kompleks), Record<string, string> (Matching), string (Essay)
  autoScore?: number;
  manualScore?: number;
  isGraded?: boolean;
  notes?: string;
  savedAt: string;
}

export interface StudentSession {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: 'in_progress' | 'submitted' | 'locked_violation' | 'force_submitted';
  answers: Record<string, StudentAnswer>;
  isDoubtful: Record<string, boolean>; // Flag ragu-ragu per questionId
  violations: ViolationRecord[];
  totalScore: number;
  maxScore: number;
  isFullyGraded: boolean;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface ItemAnalysis {
  questionId: string;
  questionNumber: number;
  type: QuestionType;
  textSnippet: string;
  totalAttempts: number;
  correctCount: number;
  accuracyRate: number; // 0 - 100%
  difficultyLabel: 'Sangat Mudah' | 'Mudah' | 'Sedang' | 'Sukar' | 'Sangat Sukar';
  discriminationIndex: number; // Indeks daya beda (-1.0 s/d 1.0)
  optionDistribution?: Record<string, number>;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'guru';
  subject?: string;
  createdAt: string;
}

