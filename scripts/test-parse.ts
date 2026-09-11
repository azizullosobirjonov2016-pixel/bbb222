/* Parser'ni haqiqiy PDF'da sinash: npx tsx scripts/test-parse.ts <file.pdf> */
/* eslint-disable no-console -- CLI debug script: console output is the point */
import { readFileSync } from 'node:fs';
// @ts-expect-error legacy build tiplari yo'q
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseUzexContract } from '../src/lib/pdf/parseUzexContract';
import type { PdfText, PdfLine } from '../src/lib/pdf/extractText';

async function extract(path: string): Promise<PdfText> {
  const data = new Uint8Array(readFileSync(path));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const lines: PdfLine[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as {
      str?: string;
      transform: number[];
    }[]) {
      if (!('str' in item)) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      const arr = rows.get(key) ?? [];
      arr.push({ x, s: item.str });
      rows.set(key, arr);
    }
    for (const [y, parts] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      parts.sort((a, b) => a.x - b.x);
      const text = parts
        .map((p) => p.s)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) lines.push({ page: p, y, text });
    }
  }
  return {
    lines,
    full: lines.map((l) => l.text).join('\n'),
    pages: doc.numPages,
  };
}

const file = process.argv[2];
extract(file).then((pdf) => {
  const only = process.argv[3];
  const ls = only
    ? pdf.lines.filter((l) => l.page === Number(only))
    : pdf.lines;
  console.log(`--- TEXT (${ls.length} lines) ---`);
  console.log(ls.map((l) => `[p${l.page}] ${l.text}`).join('\n'));
  console.log('\n--- PARSED ---');
  console.dir(parseUzexContract(pdf), { depth: null });
});
