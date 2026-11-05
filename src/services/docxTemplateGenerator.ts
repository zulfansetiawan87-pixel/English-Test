/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';

/**
 * Menghasilkan file dokumen Microsoft Word (.docx) resmi yang berisi template
 * dan aturan penulisan soal agar dapat diekstraksi secara otomatis oleh sistem CBT SecureExam.
 */
export async function generateExamTemplateDocxBlob(): Promise<Blob> {
  const doc = new Document({
    creator: 'SecureExam CBT Eskasaba',
    title: 'Template Format Soal Ujian CBT',
    description: 'Panduan dan template resmi penulisan butir soal ujian DOCX untuk import otomatis',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (1440 dxa)
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header / Judul Utama
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'TEMPLATE FORMAT SOAL UJIAN (CBT SECUREEXAM)',
                bold: true,
                size: 28, // 14pt
                color: '1E3A8A', // Navy Blue
                font: 'Calibri',
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Sistem Asesmen Sekolah Eskasaba • Format Kompatibel Ekstraksi Otomatis',
                italics: true,
                size: 20,
                color: '64748B',
                font: 'Calibri',
              }),
            ],
          }),

          // Box Petunjuk Penting
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: 'PANDUAN & ATURAN PENULISAN SOAL AGAR TERBACA OTOMATIS:',
                bold: true,
                size: 22,
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Nomor Soal: ',
                bold: true,
              }),
              new TextRun({
                text: 'Gunakan format angka diikuti titik di awal paragraf, contoh: ',
              }),
              new TextRun({ text: '1. ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'atau ' }),
              new TextRun({ text: '2. ', bold: true, color: '2563EB' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Opsi Jawaban Pilihan Ganda: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tuliskan opsi dalam baris terpisah dengan huruf kapital: ',
              }),
              new TextRun({ text: 'A. ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'B. ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'C. ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'D. ', bold: true, color: '2563EB' }),
              new TextRun({ text: 'E. ', bold: true, color: '2563EB' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Kunci Jawaban: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tuliskan baris ',
              }),
              new TextRun({ text: 'Kunci: [Huruf Opsi]', bold: true, color: '16A34A' }),
              new TextRun({ text: ' (contoh: ' }),
              new TextRun({ text: 'Kunci: A', bold: true }),
              new TextRun({ text: ' atau untuk PG Kompleks: ' }),
              new TextRun({ text: 'Kunci: A, C', bold: true }),
              new TextRun({ text: ')' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Bobot / Nilai Skor: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tuliskan baris ',
              }),
              new TextRun({ text: 'Skor: [Angka]', bold: true, color: 'D97706' }),
              new TextRun({ text: ' (contoh: ' }),
              new TextRun({ text: 'Skor: 15', bold: true }),
              new TextRun({ text: '). Jika tidak diisi, sistem otomatis memberi skor default 10.' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Soal Menjodohkan: ',
                bold: true,
              }),
              new TextRun({
                text: 'Sertakan kata ',
              }),
              new TextRun({ text: '(Menjodohkan)', bold: true }),
              new TextRun({ text: ' di kalimat soal dan pasangkan format: ' }),
              new TextRun({ text: '[Premis] = [Respon Jawaban]', bold: true, color: '0D9488' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Uraian Singkat / Esai: ',
                bold: true,
              }),
              new TextRun({
                text: 'Sertakan kata ',
              }),
              new TextRun({ text: '(Uraian Singkat)', bold: true }),
              new TextRun({ text: ' dengan kunci kata jawaban, atau ' }),
              new TextRun({ text: '(Uraian Panjang)', bold: true }),
              new TextRun({ text: ' disertai baris ' }),
              new TextRun({ text: 'Rubrik: [kriteria]', bold: true }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Teks Multimodal (Gambar, Audio, Video): ',
                bold: true,
              }),
              new TextRun({
                text: 'Sertakan kata ',
              }),
              new TextRun({ text: '(Teks Multimodal)', bold: true, color: '7C3AED' }),
              new TextRun({ text: ' dan tag media seperti: ' }),
              new TextRun({ text: '[Media Gambar: URL | Judul]', bold: true, color: '2563EB' }),
              new TextRun({ text: ', ' }),
              new TextRun({ text: '[Media Audio: URL | Judul]', bold: true, color: 'D97706' }),
              new TextRun({ text: ', atau ' }),
              new TextRun({ text: '[Media Video: URL | Judul]', bold: true, color: 'DC2626' }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: 'Pembahasan (Opsional): ',
                bold: true,
              }),
              new TextRun({
                text: 'Tuliskan baris ',
              }),
              new TextRun({ text: 'Pembahasan: [penjelasan singkat materi]', italics: true }),
            ],
          }),

          // Divider Baris
          new Paragraph({
            spacing: { before: 180, after: 180 },
            children: [
              new TextRun({
                text: '-----------------------------------------------------------------------------------------------------------------',
                color: 'CBD5E1',
              }),
            ],
          }),

          // CONTOH BUTIR SOAL 1: Pilihan Ganda Tunggal
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '1. Manakah di bawah ini topologi jaringan komputer yang memiliki tingkat keandalan tertinggi karena setiap node terhubung langsung ke node lainnya?',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Topologi Mesh' })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Topologi Star' })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Topologi Bus' })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Topologi Ring' })] }),
          new Paragraph({ children: [new TextRun({ text: 'E. Topologi Tree' })] }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Kunci: ', bold: true }),
              new TextRun({ text: 'A', bold: true, color: '16A34A' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '15', bold: true, color: 'D97706' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Pembahasan: ', bold: true }),
              new TextRun({
                text: 'Topologi mesh memiliki link redundansi ganda sehingga jika satu kabel putus, transmisi data tetap berjalan melalui jalur lain.',
                italics: true,
                color: '475569',
              }),
            ],
          }),

          // CONTOH BUTIR SOAL 2: Pilihan Ganda Kompleks
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '2. Pilihlah 2 (dua) bahasa pemrograman yang dapat dieksekusi langsung secara native oleh browser pada sisi klien! (Pilihan Ganda Kompleks)',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. JavaScript' })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Python' })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. WebAssembly' })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. PHP' })] }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Kunci: ', bold: true }),
              new TextRun({ text: 'A, C', bold: true, color: '16A34A' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '20', bold: true, color: 'D97706' }),
            ],
          }),

          // CONTOH BUTIR SOAL 3: Menjodohkan
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '3. Pasangkan lapisan protokol pada model referensi OSI dengan unit data protokolnya yang sesuai! (Menjodohkan)',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: '[Layer Transport] = [Segment]', color: '0D9488', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: '[Layer Network] = [Packet]', color: '0D9488', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: '[Layer Data Link] = [Frame]', color: '0D9488', bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: '[Layer Physical] = [Bit]', color: '0D9488', bold: true })] }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '20', bold: true, color: 'D97706' }),
            ],
          }),

          // CONTOH BUTIR SOAL 4: Uraian Singkat
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '4. Sebutkan singkatan dari protokol keamanan jaringan yang menggunakan enkripsi SSL/TLS untuk penjelajahan situs web aman! (Uraian Singkat)',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Kunci: ', bold: true }),
              new TextRun({ text: 'HTTPS, Hypertext Transfer Protocol Secure', bold: true, color: '16A34A' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '15', bold: true, color: 'D97706' }),
            ],
          }),

          // CONTOH BUTIR SOAL 5: Uraian Panjang / Esai
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '5. Jelaskan mengapa penerapan mekanisme enkripsi data dan otentikasi dua faktor (2FA) sangat penting dalam transaksi perbankan digital! (Uraian Panjang)',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Rubrik: ', bold: true }),
              new TextRun({
                text: 'Skor maksimal diberikan jika siswa menjelaskan aspek kerahasiaan data (confidentiality), integritas pesan (integrity), dan pencegahan serangan Man-in-the-Middle.',
                italics: true,
                color: '334155',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '30', bold: true, color: 'D97706' }),
            ],
          }),

          // CONTOH BUTIR SOAL 6: Teks Multimodal (Gambar, Audio, Video)
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '6. Perhatikan diagram topologi jaringan dan rekaman audio teknisi berikut. Apa permasalahan utama yang dialami switch core? (Teks Multimodal)',
                bold: true,
                size: 22,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '[Media Gambar: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800 | Diagram Topologi Server Jaringan]',
                color: '2563EB',
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '[Media Audio: https://actions.google.com/sounds/v1/science/ambient_laboratory_with_bubbles.ogg | Rekaman Laporan Audio Teknisi NOC]',
                color: 'D97706',
                italics: true,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: 'A. Port uplink mengalami frame collision dan kelebihan broadcast' })] }),
          new Paragraph({ children: [new TextRun({ text: 'B. Kabel FO putus total' })] }),
          new Paragraph({ children: [new TextRun({ text: 'C. Suhu server room terlalu dingin' })] }),
          new Paragraph({ children: [new TextRun({ text: 'D. Power supply UPS kelebihan daya' })] }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Kunci: ', bold: true }),
              new TextRun({ text: 'A', bold: true, color: '16A34A' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Skor: ', bold: true }),
              new TextRun({ text: '20', bold: true, color: 'D97706' }),
            ],
          }),


          // Catatan Akhir
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300 },
            children: [
              new TextRun({
                text: '=== Akhir Dokumen Template Soal ===',
                italics: true,
                size: 18,
                color: '94A3B8',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Memicu unduhan otomatis berkas DOCX di peramban pengguna
 */
export async function downloadExamTemplateDocx(fileName = 'Template_Soal_Ujian_SecureExam.docx'): Promise<void> {
  const blob = await generateExamTemplateDocxBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
