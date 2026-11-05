/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TeacherAccount } from '../types';
import { db } from './db';

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig: { url: string; anonKey: string } | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = db.getSupabaseConfig();
  const url = config.url || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const anonKey = config.anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    return null;
  }

  if (
    cachedClient &&
    lastUsedConfig?.url === url &&
    lastUsedConfig?.anonKey === anonKey
  ) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedConfig = { url, anonKey };
    return cachedClient;
  } catch (e) {
    console.error('Gagal inisialisasi Supabase Client:', e);
    return null;
  }
}

/**
 * Fetch teachers list from Supabase 'teachers' table with local fallback
 */
export async function fetchTeachersList(): Promise<{
  teachers: TeacherAccount[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map database records to TeacherAccount
        const mapped: TeacherAccount[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          password: row.password_hint || '123456789',
          role: row.role || 'guru',
          subject: row.subject || 'Umum',
          createdAt: row.created_at || new Date().toISOString(),
        }));

        // Always ensure Admin@eskasaba.id is retained
        if (!mapped.some(t => t.email.toLowerCase() === 'admin@eskasaba.id')) {
          mapped.unshift({
            id: 'teacher-admin-01',
            name: 'Administrator Utama (Eskasaba)',
            email: 'Admin@eskasaba.id',
            password: '123456789',
            role: 'super_admin',
            subject: 'Semua Mata Pelajaran / Proktor',
            createdAt: new Date().toISOString(),
          });
        }

        // Synchronize into local storage
        mapped.forEach(t => db.saveTeacher(t));
        return { teachers: mapped, source: 'supabase' };
      }
    } catch (e: any) {
      console.warn('Gagal memuat guru dari Supabase table, beralih ke penyimpanan lokal:', e);
    }
  }

  // Fallback to cloud server or reactive local storage
  try {
    const res = await fetch('/api/teachers');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.teachers) && json.teachers.length > 0) {
        json.teachers.forEach((t: any) => db.saveTeacher(t));
        return {
          teachers: db.getTeachers(),
          source: 'supabase',
        };
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    teachers: db.getTeachers(),
    source: 'local',
  };
}

/**
 * Add a teacher account using Supabase Auth & 'teachers' table
 */
export async function addTeacherWithSupabase(data: {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'guru';
  subject: string;
}): Promise<{
  success: boolean;
  teacher?: TeacherAccount;
  authUserId?: string;
  source: 'supabase' | 'local';
  message: string;
}> {
  const supabase = getSupabaseClient();
  const cleanEmail = data.email.trim();
  const cleanName = data.name.trim();

  // 1. If Supabase is connected, trigger Supabase Auth signUp and insert into 'teachers' table
  if (supabase) {
    try {
      // A. Create User in Supabase Auth
      let authUserId: string | undefined = undefined;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            name: cleanName,
            role: data.role,
            subject: data.subject,
          },
        },
      });

      if (authError && !authError.message.includes('User already registered')) {
        console.warn('Supabase Auth signUp note:', authError.message);
      } else if (authData?.user) {
        authUserId = authData.user.id;
      }

      // B. Insert row into dedicated 'teachers' table
      const newId = '00000000-0000-0000-0000-' + Date.now().toString().slice(-12).padStart(12, '0');
      const { error: dbError } = await supabase.from('teachers').insert([
        {
          id: newId,
          auth_user_id: authUserId,
          name: cleanName,
          email: cleanEmail,
          password_hint: data.password,
          role: data.role,
          subject: data.subject,
          created_at: new Date().toISOString(),
        },
      ]);

      if (dbError) {
        console.warn('Gagal insert ke tabel teachers Supabase:', dbError.message);
      }

      const newTeacher: TeacherAccount = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        password: data.password,
        role: data.role,
        subject: data.subject,
        createdAt: new Date().toISOString(),
      };

      db.saveTeacher(newTeacher);

      return {
        success: true,
        teacher: newTeacher,
        authUserId,
        source: 'supabase',
        message: 'Akun guru berhasil dibuat di Supabase Auth & tabel teachers PostgreSQL!',
      };
    } catch (err: any) {
      console.warn('Supabase request failed, falling back to local DB:', err);
    }
  }

  // 2. Local Fallback
  const newTeacher: TeacherAccount = {
    id: 'teacher-' + Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: data.password,
    role: data.role,
    subject: data.subject,
    createdAt: new Date().toISOString(),
  };

  db.saveTeacher(newTeacher);

  return {
    success: true,
    teacher: newTeacher,
    source: 'local',
    message: 'Akun guru tersimpan secara persisten di database lokal (Supabase belum dihubungkan).',
  };
}

/**
 * Delete teacher from Supabase 'teachers' table and local store
 */
export async function deleteTeacherWithSupabase(teacher: TeacherAccount): Promise<{
  success: boolean;
  message: string;
}> {
  if (teacher.email.toLowerCase() === 'admin@eskasaba.id') {
    return {
      success: false,
      message: 'Akun Administrator Utama (Admin@eskasaba.id) tidak dapat dihapus.',
    };
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      await supabase.from('teachers').delete().eq('email', teacher.email);
    } catch (e) {
      console.warn('Gagal menghapus dari Supabase teachers:', e);
    }
  }

  db.deleteTeacher(teacher.id);

  return {
    success: true,
    message: `Akun guru "${teacher.name}" berhasil dihapus dari sistem.`,
  };
}
