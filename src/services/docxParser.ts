/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';
import { Question, OptionItem, QuestionType, QuestionMedia } from '../types';

export interface ParsedQuestionResult {
  questions: Question[];
  rawText: string;
  errors: string[];
  warnings: string[];
}

export async function parseDocxFile(file: File): Promise<ParsedQuestionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const extractResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = extractResult.value;
  return parseRawExamText(rawText);
}

export function parseRawExamText(rawText: string): ParsedQuestionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: Question[] = [];

  // Normalize line endings
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by question number pattern: e.g. "1. ", "2. ", "[1] ", "No 1. "
  const blocks = normalized.split(/\n(?=(?:\d+[\.\)]|No\s*\d+[\.\)]|\[\d+\]))\s*/i);

  let questionCounter = 1;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.length < 5) continue;

    // Check if this block looks like a question
    const headerMatch = trimmed.match(/^(?:(?:No\s*)?(\d+)[\.\)]|\[(\d+)\])\s*([\s\S]*)/i);
    const textContent = headerMatch ? headerMatch[3].trim() : trimmed;

    // Extract Points / Skor if exists e.g. "Skor: 20" or "Poin: 15"
    let points = 10;
    const scoreMatch = textContent.match(/(?:Skor|Poin|Points|Bobot)\s*[:=]\s*(\d+)/i);
    if (scoreMatch) {
      points = parseInt(scoreMatch[1], 10) || 10;
    }

    // Extract Explanation / Pembahasan
    let explanation = '';
    const expMatch = textContent.match(/(?:Pembahasan|Penjelasan|Explanation)\s*[:=]\s*([^\n]+)/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
    }

    // Extract media tags: [Media Gambar: url | Caption], [Media Audio: url], [Media Video: url]
    const media: QuestionMedia[] = [];
    const mediaRegex = /\[Media\s*(Gambar|Audio|Video|Suara)\s*[:=]\s*([^\s\]|]+)(?:\s*\|\s*([^\]]+))?\]/gi;
    let mMatch;
    while ((mMatch = mediaRegex.exec(textContent)) !== null) {
      const rawMediaType = mMatch[1].toLowerCase();
      const mType: 'image' | 'audio' | 'video' = rawMediaType.includes('audio') || rawMediaType.includes('suara')
        ? 'audio'
        : rawMediaType.includes('video')
        ? 'video'
        : 'image';
      const url = mMatch[2].trim();
      const title = mMatch[3]?.trim() || `Media ${mType.toUpperCase()}`;
      media.push({
        id: `media-${questionCounter}-${media.length + 1}`,
        type: mType,
        url,
        title
      });
    }

    const isMultimodalExplicit = /multimodal/i.test(textContent) || media.length > 0;

    // Check Question Type markers in block
    const isComplex = /kompleks|lebih dari satu|multi[\s-]select/i.test(textContent);
    const isMatching = /jodohkan|pasangkan|menjodohkan|matching|kelompokkan/i.test(textContent);
    const isShortAnswer = /uraian singkat|isian singkat|jawaban singkat|short answer/i.test(textContent);
    const isEssay = /uraian panjang|essay|esai|jelaskan/i.test(textContent) && !/^[A-D]\.\s+/m.test(textContent);

    // Extract Answer Key e.g. "Kunci: B" or "Kunci Jawaban: A, C"
    const keyMatch = textContent.match(/(?:Kunci(?:\s*Jawaban)?|Kunci|Jawaban)\s*[:=]\s*([^\n]+)/i);
    const rawKey = keyMatch ? keyMatch[1].trim() : '';

    if (isMatching) {
      // Parse matching pairs format: e.g. [Layer 7] = [HTTP] or Premise : Response
      const lines = textContent.split('\n');
      const pairs: { id: string; premise: string; response: string }[] = [];
      let pairCount = 1;

      for (const line of lines) {
        const pairMatch = line.match(/(?:\[(.*?)\]\s*=\s*\[(.*?)\]|^(.*?)\s*(?:=>|->|:|=)\s*(.*?)$)/);
        if (pairMatch) {
          const premise = (pairMatch[1] || pairMatch[3] || '').trim();
          const response = (pairMatch[2] || pairMatch[4] || '').trim();
          if (premise && response && !/^(skor|kunci|tipe|poin|media)/i.test(premise)) {
            pairs.push({
              id: `pair-${questionCounter}-${pairCount++}`,
              premise,
              response
            });
          }
        }
      }

      questions.push({
        id: `imported-q-${Date.now()}-${questionCounter}`,
        type: 'matching',
        text: cleanQuestionBody(textContent),
        points: points || 20,
        media: media.length > 0 ? media : undefined,
        matchingPairs: pairs.length > 0 ? pairs : [
          { id: `p1-${questionCounter}`, premise: 'Konsep A', response: 'Definisi A' },
          { id: `p2-${questionCounter}`, premise: 'Konsep B', response: 'Definisi B' }
        ],
        explanation
      });
    } else if (isShortAnswer) {
      const keywords = rawKey
        ? rawKey.split(/[,;\/]/).map(k => k.trim()).filter(Boolean)
        : [];

      questions.push({
        id: `imported-q-${Date.now()}-${questionCounter}`,
        type: isMultimodalExplicit ? 'multimodal' : 'short_answer',
        multimodalResponseType: isMultimodalExplicit ? 'short_answer' : undefined,
        text: cleanQuestionBody(textContent),
        points: points || 15,
        media: media.length > 0 ? media : undefined,
        shortAnswerKeywords: keywords.length > 0 ? keywords : ['jawaban'],
        explanation
      });
    } else if (isEssay) {
      // Rubric
      let rubric = '';
      const rubricMatch = textContent.match(/(?:Rubrik|Kriteria)\s*[:=]\s*([^\n]+)/i);
      if (rubricMatch) rubric = rubricMatch[1].trim();

      questions.push({
        id: `imported-q-${Date.now()}-${questionCounter}`,
        type: isMultimodalExplicit ? 'multimodal' : 'essay',
        multimodalResponseType: isMultimodalExplicit ? 'essay' : undefined,
        text: cleanQuestionBody(textContent),
        points: points || 20,
        media: media.length > 0 ? media : undefined,
        essayRubric: rubric || 'Penilaian manual oleh guru berdasarkan kejelasan dan kelengkapan konsep.',
        explanation
      });
    } else {
      // Multiple Choice or Complex Multiple Choice or Multimodal
      const options: OptionItem[] = [];
      const optionLetters = ['A', 'B', 'C', 'D', 'E'];
      
      // Look for lines like "A. ...", "B) ...", "a. ..."
      const optionRegex = /(?:^|\n)\s*([A-Ea-e])[\.\)]\s*([^\n]+)/g;
      let optMatch;
      while ((optMatch = optionRegex.exec(textContent)) !== null) {
        const letter = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        options.push({
          id: `opt-${questionCounter}-${letter.toLowerCase()}`,
          text
        });
      }

      // If no A-D found but has lines
      if (options.length === 0) {
        // Fallback to essay / multimodal essay
        questions.push({
          id: `imported-q-${Date.now()}-${questionCounter}`,
          type: isMultimodalExplicit ? 'multimodal' : 'essay',
          multimodalResponseType: isMultimodalExplicit ? 'essay' : undefined,
          text: cleanQuestionBody(textContent),
          points,
          media: media.length > 0 ? media : undefined,
          explanation
        });
        warnings.push(`Soal #${questionCounter} tidak memiliki opsi A-D, dialihkan sebagai Uraian.`);
      } else {
        const type: QuestionType = isMultimodalExplicit
          ? 'multimodal'
          : isComplex
          ? 'complex_multiple_choice'
          : 'multiple_choice';

        const multimodalResponseType = isMultimodalExplicit
          ? isComplex
            ? 'complex_multiple_choice'
            : 'multiple_choice'
          : undefined;

        // Match correct key with options
        let correctAnswer: any = undefined;
        if (!isComplex) {
          const singleKeyLetter = rawKey.match(/([A-E])/i)?.[1]?.toUpperCase();
          if (singleKeyLetter) {
            const letterIdx = optionLetters.indexOf(singleKeyLetter);
            if (letterIdx >= 0 && letterIdx < options.length) {
              correctAnswer = options[letterIdx].id;
            }
          }
          if (!correctAnswer && options.length > 0) {
            correctAnswer = options[0].id; // Default first if missing key
            warnings.push(`Kunci jawaban soal #${questionCounter} tidak terdeteksi otomatis, disetel ke opsi A.`);
          }
        } else {
          // Complex multiple choice (e.g. "A, C" or "B and D")
          const letters = (rawKey.match(/[A-E]/gi) || []).map(l => l.toUpperCase());
          const correctIds = letters
            .map(l => {
              const idx = optionLetters.indexOf(l);
              return idx >= 0 && idx < options.length ? options[idx].id : null;
            })
            .filter(Boolean) as string[];

          correctAnswer = correctIds.length > 0 ? correctIds : [options[0]?.id].filter(Boolean);
        }

        questions.push({
          id: `imported-q-${Date.now()}-${questionCounter}`,
          type,
          multimodalResponseType,
          text: cleanQuestionBody(textContent),
          points,
          media: media.length > 0 ? media : undefined,
          options,
          correctAnswer,
          explanation
        });
      }
    }

    questionCounter++;
  }

  if (questions.length === 0) {
    errors.push('Tidak dapat menemukan butir soal yang valid dari berkas. Pastikan terdapat penomoran seperti "1.", "2.", dsb.');
  }

  return { questions, rawText, errors, warnings };
}

function cleanQuestionBody(text: string): string {
  // Strip out options, kunci, skor, rubrik, and media tags from question stem
  return text
    .replace(/(?:^|\n)\s*[A-Ea-e][\.\)][\s\S]*$/g, '')
    .replace(/(?:Skor|Poin|Points|Bobot)\s*[:=].*$/gim, '')
    .replace(/(?:Kunci(?:\s*Jawaban)?|Kunci|Jawaban)\s*[:=].*$/gim, '')
    .replace(/(?:Pembahasan|Penjelasan|Explanation)\s*[:=].*$/gim, '')
    .replace(/(?:Rubrik|Kriteria)\s*[:=].*$/gim, '')
    .replace(/\[Media\s*(?:Gambar|Audio|Video|Suara)\s*[:=][^\]]+\]/gi, '')
    .trim();
}

export const SAMPLE_DOCX_FORMAT = `CONTOH FORMAT SOAL UNTUK IMPORT DOKUMEN:

1. Di bawah ini yang merupakan topologi jaringan dengan keandalan tertinggi adalah...
A. Topologi Mesh
B. Topologi Star
C. Topologi Bus
D. Topologi Ring
Kunci: A
Skor: 15
Pembahasan: Topologi mesh memiliki jalur redundan ganda sehingga paling tahan kerusakan.

2. Pilihlah 2 (dua) bahasa pemrograman yang berjalan di sisi peramban (client-side browser)! (Pilihan Ganda Kompleks)
A. JavaScript
B. Python Backend
C. WebAssembly
D. Bash Shell
Kunci: A, C
Skor: 20

3. Pasangkan layer jaringan dengan unit datanya! (Menjodohkan)
[Layer Transport] = [Segment]
[Layer Network] = [Packet]
[Layer Data Link] = [Frame]
[Layer Physical] = [Bit]
Skor: 20

4. Singkatan dari Cascading Style Sheets yang digunakan untuk mengatur tata letak web adalah... (Uraian Singkat)
Kunci: CSS
Skor: 15

5. Jelaskan mengapa enkripsi data penting dalam komunikasi perbankan online! (Uraian Panjang)
Rubrik: Skor maksimal jika siswa menjelaskan kerahasiaan data, integritas pesan, dan pencegahan sniffing Man-in-the-Middle.
Skor: 30

6. Perhatikan diagram topologi jaringan dan rekaman audio teknisi berikut. Apa permasalahan utama yang dialami switch core? (Teks Multimodal)
[Media Gambar: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800 | Diagram Topologi Server Jaringan]
[Media Audio: https://actions.google.com/sounds/v1/science/ambient_laboratory_with_bubbles.ogg | Rekaman Laporan Audio Teknisi NOC]
A. Port uplink mengalami frame collision dan kelebihan broadcast
B. Kabel FO putus total
C. Suhu server room terlalu dingin
D. Power supply UPS kelebihan daya
Kunci: A
Skor: 20
`;

