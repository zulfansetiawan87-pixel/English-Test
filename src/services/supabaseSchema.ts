/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SECUREEXAM CBT - POSTGRESQL & SUPABASE PRODUCTION SCHEMA & RLS
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Quizzes Table (Kuis / Asesmen)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    target_classes TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    token VARCHAR(30),
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options BOOLEAN DEFAULT true,
    show_score_after_submit BOOLEAN DEFAULT true,
    max_violations INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Questions Table (Soal Kuis)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'complex_multiple_choice', 'matching', 'short_answer', 'essay')),
    text TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    options JSONB DEFAULT '[]'::jsonb,                 -- Untuk PG & PG Kompleks
    correct_answer JSONB,                              -- Kunci jawaban (id atau array of id)
    matching_pairs JSONB DEFAULT '[]'::jsonb,          -- Untuk soal menjodohkan
    short_answer_keywords TEXT[] DEFAULT '{}',         -- Kata kunci uraian singkat
    essay_rubric TEXT,                                 -- Rubrik penskoran uraian panjang
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Question Bank Table (Bank Soal Master)
CREATE TABLE IF NOT EXISTS public.bank_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(150) NOT NULL,
    topic VARCHAR(150),
    difficulty VARCHAR(20) CHECK (difficulty IN ('mudah', 'sedang', 'sulit')),
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer JSONB,
    matching_pairs JSONB DEFAULT '[]'::jsonb,
    short_answer_keywords TEXT[] DEFAULT '{}',
    essay_rubric TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Student Sessions Table (Sesi Ujian Siswa)
CREATE TABLE IF NOT EXISTS public.student_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name VARCHAR(200) NOT NULL,
    student_nis VARCHAR(50) NOT NULL,
    student_class VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'locked_violation', 'force_submitted')),
    answers JSONB DEFAULT '{}'::jsonb,
    is_doubtful JSONB DEFAULT '{}'::jsonb,
    total_score NUMERIC(5,2) DEFAULT 0,
    max_score NUMERIC(5,2) DEFAULT 0,
    is_fully_graded BOOLEAN DEFAULT false,
    device_info TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (quiz_id, student_nis)
);

-- 6. Violations Log Table (Log Pelanggaran Real-time)
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.student_sessions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    question_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Teachers Table (Akun Guru & Auth Profile Terintegrasi)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID,                                 -- Link ke auth.users(id) Supabase
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hint VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'guru' CHECK (role IN ('super_admin', 'guru')),
    subject VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inisialisasi Akun Administrator Default Eskasaba
INSERT INTO public.teachers (id, name, email, password_hint, role, subject)
VALUES ('00000000-0000-0000-0000-000000000001', 'Administrator Utama (Eskasaba)', 'Admin@eskasaba.id', '123456789', 'super_admin', 'Semua Mata Pelajaran / Proktor')
ON CONFLICT (email) DO NOTHING;

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- 9. Policies
-- A. Quizzes: Siswa dapat membaca kuis yang sedang aktif
CREATE POLICY "Public read active quizzes" ON public.quizzes
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admin full access to quizzes" ON public.quizzes
    FOR ALL TO authenticated USING (true);

-- B. Questions: Siswa dapat membaca soal saat sesi kuis aktif
CREATE POLICY "Public read questions of active quiz" ON public.questions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.status = 'active'
    ));

CREATE POLICY "Admin full access to questions" ON public.questions
    FOR ALL TO authenticated USING (true);

-- C. Student Sessions: Siswa dapat membuat sesi dan mengupdate jawabannya
CREATE POLICY "Student insert own session" ON public.student_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Student read own session" ON public.student_sessions
    FOR SELECT USING (true);

CREATE POLICY "Student update own session while in_progress" ON public.student_sessions
    FOR UPDATE USING (status = 'in_progress') WITH CHECK (true);

CREATE POLICY "Admin full access to sessions" ON public.student_sessions
    FOR ALL TO authenticated USING (true);

-- D. Violations: Siswa dapat menambahkan catatan pelanggaran, Admin dapat melihat semua
CREATE POLICY "Student insert violation" ON public.violations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read all violations" ON public.violations
    FOR SELECT TO authenticated USING (true);

-- E. Teachers Table Policies
CREATE POLICY "Admin full access to teachers" ON public.teachers
    FOR ALL USING (true);
`;

