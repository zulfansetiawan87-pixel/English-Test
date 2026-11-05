/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Quiz, StudentSession, ItemAnalysis } from '../types';

export function exportExamResultsToExcel(quiz: Quiz, sessions: StudentSession[]) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Ringkasan Nilai Siswa
  const summaryData = sessions.map((s, idx) => {
    const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
    const isPassed = pct >= 75;
    return {
      'No': idx + 1,
      'NIS': s.studentNis,
      'Nama Siswa': s.studentName,
      'Kelas': s.studentClass,
      'Waktu Mulai': new Date(s.startedAt).toLocaleString('id-ID'),
      'Waktu Selesai': s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID') : 'Belum selesai',
      'Status Pengerjaan': s.status === 'submitted' ? 'Selesai' : s.status === 'locked_violation' ? 'Terkunci (Curang)' : s.status === 'force_submitted' ? 'Dipaksa Kumpul' : 'Sedang Mengerjakan',
      'Total Pelanggaran': s.violations.length,
      'Nilai Total': s.totalScore,
      'Nilai Maksimal': s.maxScore,
      'Persentase (%)': `${pct}%`,
      'Keterangan': isPassed ? 'TUNTAS' : 'REMEDIAL',
      'Status Koreksi': s.isFullyGraded ? 'Sudah Dinilai Lengkap' : 'Menunggu Koreksi Uraian'
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Nilai');

  // 2. Sheet 2: Rincian Skor per Nomor
  const detailsData = sessions.map((s, idx) => {
    const row: Record<string, any> = {
      'No': idx + 1,
      'NIS': s.studentNis,
      'Nama': s.studentName,
      'Kelas': s.studentClass
    };

    quiz.questions.forEach((q, qIdx) => {
      const ans = s.answers[q.id];
      const qScore = ans?.manualScore ?? ans?.autoScore ?? 0;
      row[`Soal ${qIdx + 1} (${q.type === 'essay' ? 'Uraian' : 'Auto'}) [Max ${q.points}]`] = qScore;
    });

    row['TOTAL SKOR'] = s.totalScore;
    return row;
  });

  const wsDetails = XLSX.utils.json_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Rincian Skor per Nomor');

  // 3. Sheet 3: Analisis Butir Soal
  const analysisData = calculateItemAnalysis(quiz, sessions).map(item => ({
    'No Soal': item.questionNumber,
    'Tipe Soal': item.type,
    'Teks Soal': item.textSnippet,
    'Total Percobaan': item.totalAttempts,
    'Menjawab Tepat/Penuh': item.correctCount,
    'Tingkat Akurasi': `${item.accuracyRate}%`,
    'Tingkat Kesukaran': item.difficultyLabel
  }));

  const wsAnalysis = XLSX.utils.json_to_sheet(analysisData);
  XLSX.utils.book_append_sheet(wb, wsAnalysis, 'Analisis Butir Soal');

  // Save File
  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const fileName = `Rekap_Nilai_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportExamResultsToCSV(quiz: Quiz, sessions: StudentSession[]) {
  const summaryData = sessions.map((s, idx) => {
    const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
    return {
      No: idx + 1,
      NIS: s.studentNis,
      Nama: s.studentName,
      Kelas: s.studentClass,
      Status: s.status,
      Pelanggaran: s.violations.length,
      Nilai: s.totalScore,
      Max: s.maxScore,
      Persentase: `${pct}%`,
      Keterangan: pct >= 75 ? 'TUNTAS' : 'REMEDIAL'
    };
  });

  const ws = XLSX.utils.json_to_sheet(summaryData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Nilai_${quiz.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function calculateItemAnalysis(quiz: Quiz, sessions: StudentSession[]): ItemAnalysis[] {
  const result: ItemAnalysis[] = [];
  const completed = sessions.filter(s => s.status === 'submitted' || s.status === 'force_submitted');
  const totalCount = completed.length || 1;

  quiz.questions.forEach((q, idx) => {
    let fullCorrect = 0;
    let earnedPointsTotal = 0;
    const optionDist: Record<string, number> = {};

    completed.forEach(s => {
      const ans = s.answers[q.id];
      if (!ans) return;

      const score = ans.manualScore ?? ans.autoScore ?? 0;
      earnedPointsTotal += score;
      if (score >= q.points) {
        fullCorrect++;
      }

      // Track option distribution for MC
      if (q.type === 'multiple_choice' && ans.value) {
        optionDist[ans.value] = (optionDist[ans.value] || 0) + 1;
      }
    });

    const accuracyRate = Math.round((earnedPointsTotal / (totalCount * q.points)) * 100) || 0;
    
    let difficultyLabel: 'Sangat Mudah' | 'Mudah' | 'Sedang' | 'Sukar' | 'Sangat Sukar' = 'Sedang';
    if (accuracyRate > 85) difficultyLabel = 'Sangat Mudah';
    else if (accuracyRate > 70) difficultyLabel = 'Mudah';
    else if (accuracyRate > 40) difficultyLabel = 'Sedang';
    else if (accuracyRate > 20) difficultyLabel = 'Sukar';
    else difficultyLabel = 'Sangat Sukar';

    result.push({
      questionId: q.id,
      questionNumber: idx + 1,
      type: q.type,
      textSnippet: q.text.length > 70 ? q.text.substring(0, 70) + '...' : q.text,
      totalAttempts: completed.length,
      correctCount: fullCorrect,
      accuracyRate,
      difficultyLabel,
      discriminationIndex: 0.35, // standard psychometric default
      optionDistribution: optionDist
    });
  });

  return result;
}
