/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cbt_cloud_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudStore {
  quizzes: any[];
  questionBank: any[];
  teachers: any[];
  sessions: any[];
  lastUpdated: string;
}

// Initial Seed Data if file does not exist
function getInitialStore(): CloudStore {
  return {
    quizzes: [
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
            explanation: 'Integer (int) merupakan tipe data primitif untuk merepresentasikan nilai bilangan bulat tanpa komponen desimal.',
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
            explanation: 'Rate limiting membatasi frekuensi bot menebak kredensial, sementara MFA/2FA mencegah akses meskipun password diketahui.',
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
            explanation: 'Model OSI 7-layer membagi fungsi komunikasi jaringan.',
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
            explanation: 'Perintah SELECT digunakan untuk mengambil baris dan kolom data dari tabel.',
            subject: 'Basis Data',
            difficulty: 'mudah'
          },
          {
            id: 'q5-essay',
            quizId: 'quiz-pas-rpl-01',
            type: 'essay',
            text: 'Sebuah sekolah sedang merancang sistem ujian online (CBT) skala besar. Jelaskan minimal 3 (tiga) strategi teknis dari sisi frontend, backend server, dan tata tertib pengawasan agar ujian berjalan lancar, anti-curang, dan tahan terhadap gangguan koneksi internet terputus!',
            points: 25,
            essayRubric: 'Skor 25 jika mencakup: (1) Frontend autosave & lock screen, (2) Backend server verification, (3) Kiosk mode proktor.',
            explanation: 'Aspek ketahanan CBT memerlukan autosave client-side dan server synchronization.',
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
            explanation: 'Topologi mesh penuh memiliki tautan redundan ganda antar perangkat.',
            subject: 'Informatika & Rekayasa Perangkat Lunak',
            difficulty: 'sedang'
          }
        ]
      }
    ],
    questionBank: [],
    teachers: [
      {
        id: 'teacher-admin-01',
        name: 'Administrator Utama (Eskasaba)',
        email: 'Admin@eskasaba.id',
        password: '123456789',
        role: 'super_admin',
        subject: 'Semua Mata Pelajaran / Proktor',
        createdAt: new Date().toISOString()
      },
      {
        id: 'teacher-02',
        name: 'Drs. Budi Santoso, M.Kom',
        email: 'budi.santoso@eskasaba.id',
        password: '123456789',
        role: 'guru',
        subject: 'Informatika & Pemrograman',
        createdAt: new Date().toISOString()
      }
    ],
    sessions: [],
    lastUpdated: new Date().toISOString()
  };
}

function readStore(): CloudStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.quizzes)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cloud store file:', err);
  }
  const initial = getInitialStore();
  writeStore(initial);
  return initial;
}

function writeStore(store: CloudStore): void {
  try {
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing cloud store file:', err);
  }
}

async function startServer() {
  const app = express();

  // Middleware for large payload (e.g. Base64 media & question diagrams)
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SecureExam Cloud Sync API',
      timestamp: new Date().toISOString()
    });
  });

  // Full Cloud Sync: GET
  app.get('/api/cloud-sync', (req: Request, res: Response) => {
    const store = readStore();
    res.json({
      success: true,
      quizzes: store.quizzes || [],
      questionBank: store.questionBank || [],
      teachers: store.teachers || [],
      sessions: store.sessions || [],
      lastUpdated: store.lastUpdated
    });
  });

  // Full Cloud Sync: POST
  app.post('/api/cloud-sync', (req: Request, res: Response) => {
    const { quizzes, questionBank, teachers, sessions } = req.body;
    const store = readStore();

    if (Array.isArray(quizzes)) {
      store.quizzes = quizzes;
    }
    if (Array.isArray(questionBank)) {
      store.questionBank = questionBank;
    }
    if (Array.isArray(teachers)) {
      // Ensure Admin@eskasaba.id is always maintained
      const hasAdmin = teachers.some((t: any) => t.email?.toLowerCase() === 'admin@eskasaba.id');
      if (!hasAdmin) {
        teachers.unshift({
          id: 'teacher-admin-01',
          name: 'Administrator Utama (Eskasaba)',
          email: 'Admin@eskasaba.id',
          password: '123456789',
          role: 'super_admin',
          subject: 'Semua Mata Pelajaran / Proktor',
          createdAt: new Date().toISOString()
        });
      }
      store.teachers = teachers;
    }
    if (Array.isArray(sessions)) {
      store.sessions = sessions;
    }

    writeStore(store);
    res.json({
      success: true,
      message: 'Data berhasil disinkronkan ke cloud server.',
      lastUpdated: store.lastUpdated
    });
  });

  // Quizzes CRUD
  app.get('/api/quizzes', (req: Request, res: Response) => {
    const store = readStore();
    res.json({
      success: true,
      quizzes: store.quizzes,
      lastUpdated: store.lastUpdated
    });
  });

  app.post('/api/quizzes', (req: Request, res: Response) => {
    const quiz = req.body;
    if (!quiz || !quiz.id) {
      return res.status(400).json({ success: false, error: 'Kuis tidak valid (id wajib ada)' });
    }

    const store = readStore();
    const idx = store.quizzes.findIndex((q: any) => q.id === quiz.id);
    if (idx >= 0) {
      store.quizzes[idx] = quiz;
    } else {
      store.quizzes.unshift(quiz);
    }

    writeStore(store);
    res.json({
      success: true,
      quiz,
      message: 'Kuis dan butir soal berhasil disimpan ke cloud server!',
      lastUpdated: store.lastUpdated
    });
  });

  app.delete('/api/quizzes/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = readStore();
    const initialLen = store.quizzes.length;
    store.quizzes = store.quizzes.filter((q: any) => q.id !== id);

    if (store.quizzes.length !== initialLen) {
      writeStore(store);
      return res.json({ success: true, message: 'Kuis berhasil dihapus dari cloud server.' });
    }
    res.status(404).json({ success: false, error: 'Kuis tidak ditemukan.' });
  });

  // Teachers CRUD
  app.get('/api/teachers', (req: Request, res: Response) => {
    const store = readStore();
    res.json({ success: true, teachers: store.teachers });
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const teacher = req.body;
    if (!teacher || !teacher.email) {
      return res.status(400).json({ success: false, error: 'Data guru tidak valid' });
    }

    const store = readStore();
    const idx = store.teachers.findIndex((t: any) => t.email.toLowerCase() === teacher.email.toLowerCase());
    if (idx >= 0) {
      store.teachers[idx] = { ...store.teachers[idx], ...teacher };
    } else {
      store.teachers.push(teacher);
    }

    writeStore(store);
    res.json({ success: true, teacher, message: 'Akun guru tersimpan di cloud server.' });
  });

  app.delete('/api/teachers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = readStore();
    const target = store.teachers.find((t: any) => t.id === id);

    if (target && target.email?.toLowerCase() === 'admin@eskasaba.id') {
      return res.status(403).json({ success: false, error: 'Admin utama tidak dapat dihapus.' });
    }

    store.teachers = store.teachers.filter((t: any) => t.id !== id);
    writeStore(store);
    res.json({ success: true, message: 'Akun guru berhasil dihapus dari cloud server.' });
  });

  // Question Bank
  app.get('/api/question-bank', (req: Request, res: Response) => {
    const store = readStore();
    res.json({ success: true, questionBank: store.questionBank });
  });

  app.post('/api/question-bank', (req: Request, res: Response) => {
    const question = req.body;
    if (!question || !question.id) {
      return res.status(400).json({ success: false, error: 'Soal tidak valid' });
    }

    const store = readStore();
    const idx = store.questionBank.findIndex((q: any) => q.id === question.id);
    if (idx >= 0) {
      store.questionBank[idx] = question;
    } else {
      store.questionBank.unshift(question);
    }

    writeStore(store);
    res.json({ success: true, question });
  });

  app.delete('/api/question-bank/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = readStore();
    store.questionBank = store.questionBank.filter((q: any) => q.id !== id);
    writeStore(store);
    res.json({ success: true });
  });

  // Student Exam Sessions
  app.get('/api/sessions', (req: Request, res: Response) => {
    const store = readStore();
    res.json({ success: true, sessions: store.sessions });
  });

  app.post('/api/sessions', (req: Request, res: Response) => {
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ success: false, error: 'Sesi tidak valid' });
    }

    const store = readStore();
    const idx = store.sessions.findIndex((s: any) => s.id === session.id);
    if (idx >= 0) {
      store.sessions[idx] = session;
    } else {
      store.sessions.push(session);
    }

    writeStore(store);
    res.json({ success: true, session });
  });

  // Reset Cloud Data to Demo
  app.post('/api/reset-data', (req: Request, res: Response) => {
    const initial = getInitialStore();
    writeStore(initial);
    res.json({ success: true, message: 'Data cloud berhasil di-reset ke nilai default.' });
  });

  // --- Vite / SPA Integration ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SecureExam CBT Cloud Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
