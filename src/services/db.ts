/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quiz, Question, StudentSession, StudentAnswer, ViolationRecord, TeacherAccount } from '../types';
import { cloudSync } from './cloudSync';

const STORAGE_KEY = 'secureexam_cbt_data_v2';
const CONFIG_KEY = 'secureexam_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

// Initial Admin & Teachers
export const INITIAL_TEACHERS: TeacherAccount[] = [
  {
    id: 'teacher-admin-01',
    name: 'Administrator Utama (Eskasaba)',
    email: 'Admin@eskasaba.id',
    password: '123456789',
    role: 'super_admin',
    subject: 'Semua Mata Pelajaran / Proktor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'teacher-02',
    name: 'Drs. Budi Santoso, M.Kom',
    email: 'budi.santoso@eskasaba.id',
    password: '123456789',
    role: 'guru',
    subject: 'Informatika & Pemrograman',
    createdAt: new Date().toISOString(),
  },
];

// Initial Rich Sample Quizzes
const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-pas-rpl-01',
    title: 'Penilaian Akhir Semester (PAS) - Pemrograman & Keamanan Jaringan',
    subject: 'Informatika & Rekayasa Perangkat Lunak',
    targetClasses: ['X RPL 1', 'X RPL 2', 'XI TKJ 1', 'Semua Kelas'],
    description: 'Ujian komprehensif menguji dasar algoritma, struktur data, arsitektur jaringan, serta prinsip keamanan sistem. Patuhi tata tertib kejujuran!',
    durationMinutes: 45,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
    token: 'SMK2026',
    shuffleQuestions: false,
    shuffleOptions: true,
    showScoreAfterSubmit: true,
    maxViolations: 3,
    status: 'active',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1-mc',
        quizId: 'quiz-pas-rpl-01',
        type: 'multiple_choice',
        text: 'Manakah di antara tipe data berikut yang secara khusus digunakan untuk menyimpan bilangan bulat tanpa pecahan dalam sebagian besar bahasa pemrograman modern (seperti Java, C++, TypeScript)?',
        points: 20,
        options: [
          { id: 'opt-a', text: 'float' },
          { id: 'opt-b', text: 'integer (int)' },
          { id: 'opt-c', text: 'boolean' },
          { id: 'opt-d', text: 'char' }
        ],
        correctAnswer: 'opt-b',
        explanation: 'Integer (int) merupakan tipe data primitif untuk merepresentasikan nilai bilangan bulat (positif, negatif, atau nol) tanpa komponen desimal.',
        subject: 'Dasar Pemrograman',
        difficulty: 'mudah'
      },
      {
        id: 'q2-complex',
        quizId: 'quiz-pas-rpl-01',
        type: 'complex_multiple_choice',
        text: 'Perhatikan praktik keamanan siber berikut. Manakah 2 (DUA) langkah yang paling efektif untuk mencegah serangan Brute Force pada halaman login admin web sekolah? (Pilih 2 jawaban yang benar)',
        points: 20,
        options: [
          { id: 'opt-ca', text: 'Menerapkan Rate Limiting (pembatasan percobaan login berturut-turut)' },
          { id: 'opt-cb', text: 'Menggunakan HTTP biasa tanpa sertifikat SSL/TLS' },
          { id: 'opt-cc', text: 'Mengaktifkan Multi-Factor Authentication (MFA / 2FA) berbasis OTP/Authenticator' },
          { id: 'opt-cd', text: 'Menyimpan password dalam database secara plaintext agar mudah dibaca' }
        ],
        correctAnswer: ['opt-ca', 'opt-cc'],
        explanation: 'Rate limiting membatasi frekuensi bot dalam menebak kredensial, sementara MFA/2FA mencegah akses meskipun penyerang mengetahui password.',
        subject: 'Keamanan Siber',
        difficulty: 'sedang'
      },
      {
        id: 'q3-matching',
        quizId: 'quiz-pas-rpl-01',
        type: 'matching',
        text: 'Pasangkanlah lapisan OSI Model (Kiri) dengan fungsi dan protokol utamanya (Kanan) secara tepat!',
        points: 20,
        matchingPairs: [
          { id: 'pair-1', premise: 'Application Layer', response: 'HTTP, DNS, SMTP - Antarmuka langsung ke aplikasi pengguna' },
          { id: 'pair-2', premise: 'Transport Layer', response: 'TCP / UDP - Segmentasi & keandalan transmisi end-to-end' },
          { id: 'pair-3', premise: 'Network Layer', response: 'IP Address & Routing - Penentuan rute antar jaringan paket' },
          { id: 'pair-4', premise: 'Data Link Layer', response: 'MAC Address & Frame - Deteksi error dan transfer data lokal hop-to-hop' }
        ],
        explanation: 'Model OSI 7-layer membagi fungsi komunikasi jaringan: Application (L7), Transport (L4), Network (L3), dan Data Link (L2).',
        subject: 'Jaringan Komputer',
        difficulty: 'sedang'
      },
      {
        id: 'q4-short',
        quizId: 'quiz-pas-rpl-01',
        type: 'short_answer',
        text: 'Tuliskan perintah dasar SQL (Structured Query Language) yang digunakan untuk mengekstrak atau menampilkan data dari tabel basis data relasional!',
        points: 15,
        shortAnswerKeywords: ['SELECT', 'SELECT *', 'select'],
        explanation: 'Perintah SELECT digunakan untuk mengambil baris dan kolom data dari satu atau beberapa tabel dalam PostgreSQL/MySQL.',
        subject: 'Basis Data',
        difficulty: 'mudah'
      },
      {
        id: 'q5-essay',
        quizId: 'quiz-pas-rpl-01',
        type: 'essay',
        text: 'Sebuah sekolah sedang merancang sistem ujian online (CBT) skala besar. Jelaskan minimal 3 (tiga) strategi teknis dari sisi frontend, backend server, dan tata tertib pengawasan agar ujian berjalan lancar, anti-curang, dan tahan terhadap gangguan koneksi internet terputus!',
        points: 25,
        essayRubric: 'Skor 25 jika mencakup 3 aspek: (1) Frontend: Autosave lokal/IndexedDB & pembatasan fokus/fullscreen, (2) Backend: Sinkronisasi server timestamp & optimasi query, (3) Operasional: Kiosk mode/pengawas proktor dan backup token offline.',
        explanation: 'Aspek ketahanan CBT memerlukan arsitektur hybrid: autosave client-side, verifikasi durasi di server, dan pembatasan lingkungan browser dengan mode kiosk.',
        subject: 'Arsitektur Sistem CBT',
        difficulty: 'sulit'
      },
      {
        id: 'q6-multimodal',
        quizId: 'quiz-pas-rpl-01',
        type: 'multimodal',
        text: 'Perhatikan diagram infrastruktur jaringan komputer dan rekaman audio instruksi di bawah ini dengan saksama. Berdasarkan stimulus multimodal tersebut, analisislah jenis topologi jaringan yang paling tepat untuk menjamin ketersediaan tinggi (high availability) di ruang server sekolah!',
        points: 20,
        multimodalResponseType: 'multiple_choice',
        media: [
          {
            id: 'm-img-1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80',
            title: 'Diagram Interkoneksi Server & Core Switch',
            caption: 'Bagan arsitektur topologi redundan pusat data komputer sekolah.'
          },
          {
            id: 'm-aud-1',
            type: 'audio',
            url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
            title: 'Audio Rekaman Diskusi Topologi',
            caption: 'Simak penjelasan teknis mengenai keandalan rute paket data dan failover.'
          }
        ],
        options: [
          { id: 'opt-m1', text: 'Topologi Mesh Penuh (Full Mesh Redundant)' },
          { id: 'opt-m2', text: 'Topologi Bus Konvensional' },
          { id: 'opt-m3', text: 'Topologi Ring Tunggal Tanpa Backup' },
          { id: 'opt-m4', text: 'Topologi Daisy Chain Tanpa Failover' }
        ],
        correctAnswer: 'opt-m1',
        explanation: 'Topologi mesh penuh memiliki tautan berlebih (redundansi) antar setiap perangkat, sehingga jika salah satu kabel atau port terputus, transmisi data tetap berjalan lancar.',
        subject: 'Informatika & Rekayasa Perangkat Lunak',
        difficulty: 'sedang'
      }
    ]
  },
  {
    id: 'quiz-lit-dig-02',
    title: 'Asesmen Literasi Digital & Etika Berkomunikasi',
    subject: 'Bahasa Indonesia & Literasi Digital',
    targetClasses: ['X RPL 1', 'X RPL 2', 'XI TKJ 1', 'XII AKL 1', 'Semua Kelas'],
    description: 'Evaluasi pemahaman siswa mengenai privasi data pribadi, jejak digital, serta identifikasi berita palsu (hoaks).',
    durationMinutes: 30,
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
    token: 'LITERASI',
    shuffleQuestions: true,
    shuffleOptions: true,
    showScoreAfterSubmit: true,
    maxViolations: 3,
    status: 'active',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'lit-q1',
        quizId: 'quiz-lit-dig-02',
        type: 'multiple_choice',
        text: 'Istilah untuk jejak data yang kita tinggalkan secara sadar maupun tidak sadar saat berselancar di dunia maya disebut sebagai...',
        points: 30,
        options: [
          { id: 'opt-l1', text: 'Digital Footprint (Jejak Digital)' },
          { id: 'opt-l2', text: 'Digital Native' },
          { id: 'opt-l3', text: 'Cyber Squatting' },
          { id: 'opt-l4', text: 'Bandwidth Leakage' }
        ],
        correctAnswer: 'opt-l1',
        explanation: 'Jejak digital (digital footprint) adalah jejak data yang tertinggal saat pengguna internet menggunakan perangkat digital.',
        subject: 'Literasi Digital',
        difficulty: 'mudah'
      },
      {
        id: 'lit-q2',
        quizId: 'quiz-lit-dig-02',
        type: 'short_answer',
        text: 'Apa istilah kejahatan siber yang berupaya memancing korban untuk memberikan data sensitif (seperti password atau nomor OTP) melalui tautan email/pesan palsu yang menyerupai institusi resmi?',
        points: 30,
        shortAnswerKeywords: ['phishing', 'phising', 'social engineering'],
        explanation: 'Phishing adalah upaya penipuan dengan memancing korban agar menyerahkan informasi rahasia.',
        subject: 'Keamanan Digital',
        difficulty: 'mudah'
      },
      {
        id: 'lit-q3',
        quizId: 'quiz-lit-dig-02',
        type: 'essay',
        text: 'Bagaimanakah sikap Anda sebagai pelajar dalam menyikapi sebuah informasi viral di media sosial yang belum terbukti kebenarannya sebelum memutuskan untuk membagikannya?',
        points: 40,
        essayRubric: 'Skor maksimal (40) jika siswa menjelaskan prinsip Saring Sebelum Sharing, verifikasi sumber berita kredibel, cek fakta turnbackhoax/sumber resmi, dan menahan diri dari menyebarkan kepanikan.',
        explanation: 'Prinsip literasi digital: Cek fakta, verifikasi sumber primer, pertimbangkan dampak sosial.',
        subject: 'Etika Digital',
        difficulty: 'sedang'
      }
    ]
  }
];

// Initial Rich Sample Student Sessions
const INITIAL_SESSIONS: StudentSession[] = [
  {
    id: 'session-std-01',
    quizId: 'quiz-pas-rpl-01',
    quizTitle: 'Penilaian Akhir Semester (PAS) - Pemrograman & Keamanan Jaringan',
    subject: 'Informatika & Rekayasa Perangkat Lunak',
    studentName: 'Ahmad Fauzan',
    studentNis: '102401',
    studentClass: 'X RPL 1',
    startedAt: new Date(Date.now() - 3000000).toISOString(),
    expiresAt: new Date(Date.now() - 300000).toISOString(),
    submittedAt: new Date(Date.now() - 500000).toISOString(),
    status: 'submitted',
    answers: {
      'q1-mc': {
        questionId: 'q1-mc',
        type: 'multiple_choice',
        value: 'opt-b',
        autoScore: 20,
        savedAt: new Date().toISOString()
      },
      'q2-complex': {
        questionId: 'q2-complex',
        type: 'complex_multiple_choice',
        value: ['opt-ca', 'opt-cc'],
        autoScore: 20,
        savedAt: new Date().toISOString()
      },
      'q3-matching': {
        questionId: 'q3-matching',
        type: 'matching',
        value: {
          'pair-1': 'Application Layer',
          'pair-2': 'Transport Layer',
          'pair-3': 'Network Layer',
          'pair-4': 'Data Link Layer'
        },
        autoScore: 20,
        savedAt: new Date().toISOString()
      },
      'q4-short': {
        questionId: 'q4-short',
        type: 'short_answer',
        value: 'SELECT',
        autoScore: 15,
        savedAt: new Date().toISOString()
      },
      'q5-essay': {
        questionId: 'q5-essay',
        type: 'essay',
        value: 'Untuk menjaga keamanan dan kelancaran: 1. Frontend: Menggunakan autosave IndexedDB agar jawaban tidak hilang dan sistem lock full screen. 2. Backend: Pasang rate limiting dan token autentikasi. 3. Pengawasan: Mengaktifkan mode kiosk di HP siswa.',
        manualScore: 23,
        isGraded: true,
        notes: 'Jawaban sangat baik dan mencakup ketiga pilar evaluasi.',
        savedAt: new Date().toISOString()
      }
    },
    isDoubtful: {},
    violations: [],
    totalScore: 98,
    maxScore: 100,
    isFullyGraded: true
  },
  {
    id: 'session-std-02',
    quizId: 'quiz-pas-rpl-01',
    quizTitle: 'Penilaian Akhir Semester (PAS) - Pemrograman & Keamanan Jaringan',
    subject: 'Informatika & Rekayasa Perangkat Lunak',
    studentName: 'Siti Nurhaliza',
    studentNis: '102402',
    studentClass: 'X RPL 1',
    startedAt: new Date(Date.now() - 2500000).toISOString(),
    expiresAt: new Date(Date.now() + 200000).toISOString(),
    submittedAt: new Date(Date.now() - 200000).toISOString(),
    status: 'submitted',
    answers: {
      'q1-mc': {
        questionId: 'q1-mc',
        type: 'multiple_choice',
        value: 'opt-b',
        autoScore: 20,
        savedAt: new Date().toISOString()
      },
      'q2-complex': {
        questionId: 'q2-complex',
        type: 'complex_multiple_choice',
        value: ['opt-ca', 'opt-cb'], // 1 benar, 1 salah
        autoScore: 10,
        savedAt: new Date().toISOString()
      },
      'q3-matching': {
        questionId: 'q3-matching',
        type: 'matching',
        value: {
          'pair-1': 'Application Layer',
          'pair-2': 'Transport Layer',
          'pair-3': 'Network Layer'
        },
        autoScore: 15,
        savedAt: new Date().toISOString()
      },
      'q4-short': {
        questionId: 'q4-short',
        type: 'short_answer',
        value: 'select',
        autoScore: 15,
        savedAt: new Date().toISOString()
      },
      'q5-essay': {
        questionId: 'q5-essay',
        type: 'essay',
        value: 'Menggunakan timer otomatis, kunci layar, dan database PostgreSQL terenkripsi.',
        isGraded: false, // Menunggu koreksi guru di tab Koreksi Uraian!
        savedAt: new Date().toISOString()
      }
    },
    isDoubtful: { 'q2-complex': true },
    violations: [
      {
        id: 'viol-1',
        timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(),
        type: 'visibility_hidden',
        message: 'Peserta meninggalkan layar atau berpindah tab browser',
        questionNumber: 2
      }
    ],
    totalScore: 60, // Belum ditambah essay
    maxScore: 100,
    isFullyGraded: false
  },
  {
    id: 'session-std-03',
    quizId: 'quiz-pas-rpl-01',
    quizTitle: 'Penilaian Akhir Semester (PAS) - Pemrograman & Keamanan Jaringan',
    subject: 'Informatika & Rekayasa Perangkat Lunak',
    studentName: 'Rendi Saputra',
    studentNis: '102403',
    studentClass: 'X RPL 1',
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: new Date(Date.now() + 900000).toISOString(),
    status: 'locked_violation',
    answers: {
      'q1-mc': {
        questionId: 'q1-mc',
        type: 'multiple_choice',
        value: 'opt-a',
        autoScore: 0,
        savedAt: new Date().toISOString()
      }
    },
    isDoubtful: {},
    violations: [
      {
        id: 'viol-r1',
        timestamp: new Date(Date.now() - 1500000).toLocaleTimeString(),
        type: 'exit_fullscreen',
        message: 'Peserta keluar dari mode Layar Penuh (Fullscreen)',
        questionNumber: 1
      },
      {
        id: 'viol-r2',
        timestamp: new Date(Date.now() - 1400000).toLocaleTimeString(),
        type: 'window_blur',
        message: 'Fokus jendela hilang (terdeteksi membuka aplikasi lain / split screen)',
        questionNumber: 1
      },
      {
        id: 'viol-r3',
        timestamp: new Date(Date.now() - 1300000).toLocaleTimeString(),
        type: 'visibility_hidden',
        message: 'Batas toleransi kecurangan terlampaui (3 kali pelanggaran)',
        questionNumber: 1
      }
    ],
    totalScore: 0,
    maxScore: 100,
    isFullyGraded: false
  }
];

class StorageService {
  private quizzes: Quiz[] = [];
  private sessions: StudentSession[] = [];
  private questionBank: Question[] = [];
  private teachers: TeacherAccount[] = [];

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.quizzes = parsed.quizzes || INITIAL_QUIZZES;
          this.sessions = parsed.sessions || INITIAL_SESSIONS;
          this.questionBank = parsed.questionBank || this.extractBankFromQuizzes(this.quizzes);
          this.teachers = parsed.teachers && parsed.teachers.length > 0 ? parsed.teachers : INITIAL_TEACHERS;
          
          // Pastikan akun utama Admin@eskasaba.id selalu ada
          if (!this.teachers.some(t => t.email.toLowerCase() === 'admin@eskasaba.id')) {
            this.teachers.unshift(INITIAL_TEACHERS[0]);
          }

          // Trigger background pull from cloud server
          setTimeout(() => {
            cloudSync.pullFromCloud().catch(() => {});
          }, 50);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved CBT data, using seeds', e);
    }
    this.quizzes = INITIAL_QUIZZES;
    this.sessions = INITIAL_SESSIONS;
    this.questionBank = this.extractBankFromQuizzes(INITIAL_QUIZZES);
    this.teachers = INITIAL_TEACHERS;
    this.persist();

    // Trigger initial pull from cloud server
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        cloudSync.pullFromCloud().catch(() => {});
      }, 50);
    }
  }

  public mergeCloudData(cloudData: {
    quizzes?: Quiz[];
    questionBank?: Question[];
    teachers?: TeacherAccount[];
    sessions?: StudentSession[];
  }): boolean {
    let hasChanges = false;

    if (Array.isArray(cloudData.quizzes) && cloudData.quizzes.length > 0) {
      cloudData.quizzes.forEach(cloudQuiz => {
        const localIdx = this.quizzes.findIndex(lq => lq.id === cloudQuiz.id);
        if (localIdx >= 0) {
          if (JSON.stringify(this.quizzes[localIdx]) !== JSON.stringify(cloudQuiz)) {
            this.quizzes[localIdx] = cloudQuiz;
            hasChanges = true;
          }
        } else {
          this.quizzes.unshift(cloudQuiz);
          hasChanges = true;
        }
      });
    }

    if (Array.isArray(cloudData.questionBank) && cloudData.questionBank.length > 0) {
      cloudData.questionBank.forEach(cq => {
        if (!this.questionBank.some(lq => lq.id === cq.id)) {
          this.questionBank.push(cq);
          hasChanges = true;
        }
      });
    }

    if (Array.isArray(cloudData.teachers) && cloudData.teachers.length > 0) {
      cloudData.teachers.forEach(ct => {
        const localIdx = this.teachers.findIndex(lt => lt.email.toLowerCase() === ct.email.toLowerCase());
        if (localIdx >= 0) {
          if (JSON.stringify(this.teachers[localIdx]) !== JSON.stringify(ct)) {
            this.teachers[localIdx] = ct;
            hasChanges = true;
          }
        } else {
          this.teachers.push(ct);
          hasChanges = true;
        }
      });
    }

    if (Array.isArray(cloudData.sessions) && cloudData.sessions.length > 0) {
      cloudData.sessions.forEach(cs => {
        const localIdx = this.sessions.findIndex(ls => ls.id === cs.id);
        if (localIdx >= 0) {
          if (cs.status === 'submitted' || cs.status === 'force_submitted' || (cs.violations && cs.violations.length > this.sessions[localIdx].violations.length)) {
            this.sessions[localIdx] = cs;
            hasChanges = true;
          }
        } else {
          this.sessions.push(cs);
          hasChanges = true;
        }
      });
    }

    if (hasChanges) {
      this.persist();
    }
    return hasChanges;
  }

  private extractBankFromQuizzes(quizzes: Quiz[]): Question[] {
    const list: Question[] = [];
    quizzes.forEach(q => {
      q.questions.forEach(item => {
        list.push({ ...item, quizId: undefined, subject: q.subject });
      });
    });
    return list;
  }

  public persist() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            quizzes: this.quizzes,
            sessions: this.sessions,
            questionBank: this.questionBank,
            teachers: this.teachers,
          })
        );
      }
    } catch (e) {
      console.error('Storage quota or error', e);
    }
  }

  // Quizzes CRUD
  public getQuizzes(): Quiz[] {
    return [...this.quizzes];
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.quizzes.find(q => q.id === id);
  }

  public saveQuiz(quiz: Quiz): Quiz {
    const idx = this.quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      this.quizzes[idx] = quiz;
    } else {
      this.quizzes.unshift(quiz);
    }
    this.persist();

    // Push to Cloud Server
    cloudSync.pushQuiz(quiz).catch(err => console.warn('Cloud sync push quiz failed:', err));

    return quiz;
  }

  public deleteQuiz(id: string): boolean {
    const initialLen = this.quizzes.length;
    this.quizzes = this.quizzes.filter(q => q.id !== id);
    if (this.quizzes.length !== initialLen) {
      this.persist();
      cloudSync.deleteQuiz(id).catch(err => console.warn('Cloud sync delete quiz failed:', err));
      return true;
    }
    return false;
  }

  // Question Bank
  public getQuestionBank(): Question[] {
    return [...this.questionBank];
  }

  public saveQuestionToBank(question: Question): Question {
    const idx = this.questionBank.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      this.questionBank[idx] = question;
    } else {
      this.questionBank.unshift(question);
    }
    this.persist();

    cloudSync.pushQuestionToBank(question).catch(err => console.warn('Cloud sync push question failed:', err));

    return question;
  }

  public deleteQuestionFromBank(id: string): boolean {
    this.questionBank = this.questionBank.filter(q => q.id !== id);
    this.persist();

    cloudSync.deleteQuestionFromBank(id).catch(err => console.warn('Cloud sync delete question failed:', err));

    return true;
  }

  // Student Sessions
  public getSessions(): StudentSession[] {
    return [...this.sessions];
  }

  public getSessionById(sessionId: string): StudentSession | undefined {
    return this.sessions.find(s => s.id === sessionId);
  }

  public findActiveSession(quizId: string, studentNis: string): StudentSession | undefined {
    return this.sessions.find(s => s.quizId === quizId && s.studentNis.trim() === studentNis.trim());
  }

  public saveSession(session: StudentSession): StudentSession {
    const idx = this.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      this.sessions[idx] = session;
    } else {
      this.sessions.unshift(session);
    }
    this.persist();

    cloudSync.pushSession(session).catch(err => console.warn('Cloud sync push session failed:', err));

    return session;
  }

  // Admin Actions for Proctoring
  public unlockStudent(sessionId: string): StudentSession | null {
    const session = this.getSessionById(sessionId);
    if (!session) return null;
    session.status = 'in_progress';
    // Clear violation count or keep history with a proctor reset note
    session.violations.push({
      id: 'unlock-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'context_menu',
      message: 'Status ujian dibuka kembali oleh Pengawas / Guru.'
    });
    this.saveSession(session);
    return session;
  }

  public resetStudentSession(sessionId: string): boolean {
    const session = this.getSessionById(sessionId);
    if (!session) return false;
    // Allow restart or wipe answers for technical reset
    session.status = 'in_progress';
    session.startedAt = new Date().toISOString();
    const quiz = this.getQuizById(session.quizId);
    const duration = quiz?.durationMinutes || 45;
    session.expiresAt = new Date(Date.now() + duration * 60000).toISOString();
    this.saveSession(session);
    return true;
  }

  public forceSubmitStudent(sessionId: string): StudentSession | null {
    const session = this.getSessionById(sessionId);
    if (!session) return null;
    session.status = 'force_submitted';
    session.submittedAt = new Date().toISOString();
    this.calculateFinalScores(session);
    this.saveSession(session);
    return session;
  }

  // Evaluate & Calculate Scores
  public calculateFinalScores(session: StudentSession): StudentSession {
    const quiz = this.getQuizById(session.quizId);
    if (!quiz) return session;

    let autoTotal = 0;
    let manualTotal = 0;
    let maxTotal = 0;
    let hasUngradedEssay = false;

    quiz.questions.forEach(q => {
      maxTotal += q.points;
      const ans = session.answers[q.id];
      if (!ans) return;

      if (q.type === 'multiple_choice') {
        if (ans.value === q.correctAnswer) {
          ans.autoScore = q.points;
        } else {
          ans.autoScore = 0;
        }
        autoTotal += ans.autoScore;
      } else if (q.type === 'complex_multiple_choice') {
        const correctArray = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
        const studentArray = Array.isArray(ans.value) ? ans.value : [];
        if (correctArray.length > 0) {
          // Calculate proportional accuracy
          const correctSelected = studentArray.filter(v => correctArray.includes(v)).length;
          const wrongSelected = studentArray.filter(v => !correctArray.includes(v)).length;
          const net = Math.max(0, (correctSelected - wrongSelected) / correctArray.length);
          ans.autoScore = Math.round(net * q.points);
        } else {
          ans.autoScore = 0;
        }
        autoTotal += ans.autoScore;
      } else if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        const studentMap: Record<string, string> = ans.value || {};
        let matchedCount = 0;
        pairs.forEach(p => {
          // Premise matches student's response selection
          if (studentMap[p.id] === p.premise || studentMap[p.id] === p.response) {
            matchedCount++;
          }
        });
        const score = pairs.length > 0 ? Math.round((matchedCount / pairs.length) * q.points) : 0;
        ans.autoScore = score;
        autoTotal += score;
      } else if (q.type === 'short_answer') {
        const keywords = q.shortAnswerKeywords || [];
        const studentText = String(ans.value || '').trim().toLowerCase();
        const matched = keywords.some(kw => {
          const cleanKw = kw.trim().toLowerCase();
          return cleanKw === studentText || studentText.includes(cleanKw);
        });
        ans.autoScore = matched ? q.points : 0;
        autoTotal += ans.autoScore;
      } else if (q.type === 'essay') {
        if (ans.manualScore !== undefined && ans.isGraded) {
          manualTotal += ans.manualScore;
        } else {
          hasUngradedEssay = true;
        }
      } else if (q.type === 'multimodal') {
        const respType = q.multimodalResponseType || (q.options && q.options.length > 0 ? 'multiple_choice' : 'essay');
        if (respType === 'multiple_choice') {
          if (ans.value === q.correctAnswer) {
            ans.autoScore = q.points;
          } else {
            ans.autoScore = 0;
          }
          autoTotal += ans.autoScore;
        } else if (respType === 'complex_multiple_choice') {
          const correctArray = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          const studentArray = Array.isArray(ans.value) ? ans.value : [];
          if (correctArray.length > 0) {
            const correctSelected = studentArray.filter(v => correctArray.includes(v)).length;
            const wrongSelected = studentArray.filter(v => !correctArray.includes(v)).length;
            const net = Math.max(0, (correctSelected - wrongSelected) / correctArray.length);
            ans.autoScore = Math.round(net * q.points);
          } else {
            ans.autoScore = 0;
          }
          autoTotal += ans.autoScore;
        } else if (respType === 'short_answer') {
          const keywords = q.shortAnswerKeywords || [];
          const studentText = String(ans.value || '').trim().toLowerCase();
          const matched = keywords.some(kw => {
            const cleanKw = kw.trim().toLowerCase();
            return cleanKw === studentText || studentText.includes(cleanKw);
          });
          ans.autoScore = matched ? q.points : 0;
          autoTotal += ans.autoScore;
        } else if (respType === 'essay') {
          if (ans.manualScore !== undefined && ans.isGraded) {
            manualTotal += ans.manualScore;
          } else {
            hasUngradedEssay = true;
          }
        }
      }
    });

    session.totalScore = autoTotal + manualTotal;
    session.maxScore = maxTotal;
    session.isFullyGraded = !hasUngradedEssay;
    return session;
  }

  // Supabase Configuration
  public getSupabaseConfig(): SupabaseConfig {
    try {
      const cfg = localStorage.getItem(CONFIG_KEY);
      if (cfg) return JSON.parse(cfg);
    } catch (e) {
      console.warn(e);
    }
    return {
      url: '',
      anonKey: '',
      isEnabled: false
    };
  }

  public saveSupabaseConfig(cfg: SupabaseConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  // Teacher Accounts Management
  public getTeachers(): TeacherAccount[] {
    return [...this.teachers];
  }

  public getTeacherById(id: string): TeacherAccount | undefined {
    return this.teachers.find(t => t.id === id);
  }

  public saveTeacher(teacher: TeacherAccount): TeacherAccount {
    const idx = this.teachers.findIndex(t => t.id === teacher.id);
    if (idx >= 0) {
      this.teachers[idx] = teacher;
    } else {
      this.teachers.push(teacher);
    }
    this.persist();

    cloudSync.pushTeacher(teacher).catch(err => console.warn('Cloud sync push teacher failed:', err));

    return teacher;
  }

  public deleteTeacher(id: string): boolean {
    const target = this.teachers.find(t => t.id === id);
    if (target && target.email.toLowerCase() === 'admin@eskasaba.id') {
      return false; // Tidak boleh menghapus administrator utama
    }
    const initialLen = this.teachers.length;
    this.teachers = this.teachers.filter(t => t.id !== id);
    if (this.teachers.length !== initialLen) {
      this.persist();
      cloudSync.deleteTeacher(id).catch(err => console.warn('Cloud sync delete teacher failed:', err));
      return true;
    }
    return false;
  }

  public authenticateAdminOrTeacher(email: string, pass: string): TeacherAccount | null {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    // Khusus Admin@eskasaba.id dengan password 123456789 selalu valid
    if (cleanEmail === 'admin@eskasaba.id' && cleanPass === '123456789') {
      const existing = this.teachers.find(t => t.email.toLowerCase() === 'admin@eskasaba.id');
      if (existing) return existing;
      return INITIAL_TEACHERS[0];
    }
    const found = this.teachers.find(
      t => t.email.trim().toLowerCase() === cleanEmail && t.password === cleanPass
    );
    return found || null;
  }

  public resetAllData() {
    this.quizzes = INITIAL_QUIZZES;
    this.sessions = INITIAL_SESSIONS;
    this.questionBank = this.extractBankFromQuizzes(INITIAL_QUIZZES);
    this.teachers = INITIAL_TEACHERS;
    this.persist();

    fetch('/api/reset-data', { method: 'POST' }).catch(() => {});
  }
}

export const db = new StorageService();
