/**
 * PDF'dan matn qatlamini ajratish (brauzerda, pdf.js orqali).
 * Fayl hech qayoqqa yuborilmaydi — hammasi lokal.
 */
import * as pdfjs from 'pdfjs-dist';
// Vite worker'ni shu tarzda ulaydi:
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

export interface PdfLine {
  page: number;
  y: number;
  text: string;
}

export interface PdfText {
  /** Barcha sahifalar matni, qatorlarga bo'lingan */
  lines: PdfLine[];
  /** Bitta satrga birlashtirilgan to'liq matn */
  full: string;
  pages: number;
}

/** `File` yoki `ArrayBuffer` dan matn ajratadi. */
export async function extractPdfText(
  input: File | ArrayBuffer,
): Promise<PdfText> {
  const data =
    input instanceof File ? await input.arrayBuffer() : input;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const lines: PdfLine[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Elementlarni y bo'yicha guruhlash (bir qatordagilar birlashadi)
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const t = item.transform as number[];
      const y = Math.round(t[5]);
      const x = t[4];
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      const arr = rows.get(key) ?? [];
      arr.push({ x, s: item.str });
      rows.set(key, arr);
    }
    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0]); // yuqoridan pastga
    for (const [y, parts] of sorted) {
      parts.sort((a, b) => a.x - b.x);
      const text = parts
        .map((p) => p.s)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) lines.push({ page: p, y, text });
    }
  }

  await doc.destroy();
  return {
    lines,
    full: lines.map((l) => l.text).join('\n'),
    pages: doc.numPages,
  };
}
