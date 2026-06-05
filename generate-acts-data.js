// generate-acts-data.js
// Run with: node generate-acts-data.js
// Parses KJV Acts text from Project Gutenberg into a structured JS data file.

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'KJV The Acts of the Apostles.txt');
const outputFile = path.join(__dirname, 'js', 'acts-kjv.js');

// Read the source file
const raw = fs.readFileSync(inputFile, 'utf8');

// Strip the title line
const content = raw.replace(/^The Acts of the Apostles\s*\n/, '').trim();

// Find all verse markers: pattern N:N followed by whitespace
// Only chapters 1-28 and verses 1-99
const markerRegex = /\b(1?[0-9]|2[0-8]):([1-9][0-9]?)\s+/g;

const markers = [];
let m;
while ((m = markerRegex.exec(content)) !== null) {
  const ch = parseInt(m[1]);
  const v = parseInt(m[2]);
  // Validate plausible chapter/verse
  if (ch >= 1 && ch <= 28 && v >= 1 && v <= 99) {
    markers.push({
      ch, v,
      textStart: m.index + m[0].length,
      markerStart: m.index
    });
  }
}

console.log(`Found ${markers.length} verse markers`);

// Build verse data: verses[chapter][verse] = text
const verses = {};
for (let i = 0; i < markers.length; i++) {
  const { ch, v, textStart, markerStart } = markers[i];
  const nextStart = i + 1 < markers.length ? markers[i + 1].markerStart : content.length;

  let text = content.slice(textStart, nextStart).trim();
  // Normalize whitespace
  text = text.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

  if (!verses[ch]) verses[ch] = {};
  // If verse already exists (duplicate marker), append
  if (verses[ch][v]) {
    verses[ch][v] += ' ' + text;
  } else {
    verses[ch][v] = text;
  }
}

// Count total verses
let totalVerses = 0;
for (const ch of Object.keys(verses)) {
  totalVerses += Object.keys(verses[ch]).length;
}
console.log(`Parsed ${totalVerses} verses across ${Object.keys(verses).length} chapters`);

// Print chapter summary
for (let ch = 1; ch <= 28; ch++) {
  if (verses[ch]) {
    const vNums = Object.keys(verses[ch]).map(Number).sort((a,b)=>a-b);
    console.log(`  Chapter ${ch}: verses ${vNums[0]}-${vNums[vNums.length-1]} (${vNums.length} verses)`);
  } else {
    console.log(`  Chapter ${ch}: MISSING!`);
  }
}

// Generate acts-kjv.js
let out = `// Acts KJV — All verses from Project Gutenberg (public domain)\n`;
out += `// King James Version, first published 1611. Public domain.\n`;
out += `// Source: Project Gutenberg (gutenberg.org)\n\n`;
out += `const ACTS_KJV = {\n`;

for (let ch = 1; ch <= 28; ch++) {
  if (!verses[ch]) continue;
  out += `  ${ch}: {\n`;
  const vNums = Object.keys(verses[ch]).map(Number).sort((a, b) => a - b);
  for (const v of vNums) {
    // Escape backticks and template literal syntax
    const text = verses[ch][v]
      .replace(/\\/g, '\\\\')
      .replace(/`/g, "'")
      .replace(/\$\{/g, '\\${');
    out += `    ${v}: \`${text}\`,\n`;
  }
  out += `  },\n`;
}

out += `};\n\n`;

// Helper: get a passage as HTML with verse superscripts
// ref format: "Acts C:V–V2" or "Acts C–C2" or "Acts C:V–C2:V2"
out += `
/**
 * Parse a scripture reference string into {startCh, startV, endCh, endV}
 * Handles formats like:
 *   "Acts 1:1–26"      → ch 1, v1-26
 *   "Acts 3–5"         → ch 3-5, all verses
 *   "Acts 8:1–25"      → ch 8, v1-25
 *   "Acts 22–23"       → ch 22-23, all verses
 *   "Acts 21:15–36"    → ch 21, v15-36
 *   "Acts 27:8–26"     → ch 27, v8-26
 */
function parseActsRef(ref) {
  if (!ref) return null;
  // Normalize dashes and spaces
  const s = ref.replace('Acts ', '').replace(/[–—-]/g, '-').trim();

  // Pattern: C:V-V2 (same chapter)
  let m = s.match(/^(\\d+):(\\d+)[-](\\d+)$/);
  if (m) return { startCh: +m[1], startV: +m[2], endCh: +m[1], endV: +m[3] };

  // Pattern: C:V-C2:V2 (cross chapter with verses)
  m = s.match(/^(\\d+):(\\d+)[-](\\d+):(\\d+)$/);
  if (m) return { startCh: +m[1], startV: +m[2], endCh: +m[3], endV: +m[4] };

  // Pattern: C-C2 (full chapters)
  m = s.match(/^(\\d+)[-](\\d+)$/);
  if (m) return { startCh: +m[1], startV: 1, endCh: +m[2], endV: 999 };

  // Pattern: C:V (single verse)
  m = s.match(/^(\\d+):(\\d+)$/);
  if (m) return { startCh: +m[1], startV: +m[2], endCh: +m[1], endV: +m[2] };

  // Pattern: single chapter
  m = s.match(/^(\\d+)$/);
  if (m) return { startCh: +m[1], startV: 1, endCh: +m[1], endV: 999 };

  return null;
}

/**
 * Build HTML for a passage with superscript verse numbers.
 * Returns array of page strings (each page ~300 words).
 */
function getActsPassagePages(ref, wordsPerPage) {
  wordsPerPage = wordsPerPage || 300;
  const range = parseActsRef(ref);
  if (!range) return ['<em>Reference not found: ' + ref + '</em>'];

  const { startCh, startV, endCh, endV } = range;
  let currentChapter = null;
  const tokens = []; // {type: 'chapter'|'verse', ch, v, html}

  for (let ch = startCh; ch <= endCh; ch++) {
    if (!ACTS_KJV[ch]) continue;
    const maxV = ch === endCh ? endV : 999;
    const minV = ch === startCh ? startV : 1;
    const verseNums = Object.keys(ACTS_KJV[ch]).map(Number).sort((a,b)=>a-b)
      .filter(v => v >= minV && v <= maxV);

    if (verseNums.length === 0) continue;

    // Add chapter header if entering a new chapter
    if (ch !== currentChapter) {
      tokens.push({ type: 'chapter', ch, html: '<div class="scripture-chapter-heading">Chapter ' + ch + '</div>' });
      currentChapter = ch;
    }

    for (const v of verseNums) {
      const text = ACTS_KJV[ch][v];
      const html = '<sup class="verse-num">' + v + '</sup>' + text + ' ';
      const wordCount = text.split(/\\s+/).length;
      tokens.push({ type: 'verse', ch, v, html, wordCount });
    }
  }

  if (tokens.length === 0) return ['<em>No text found for: ' + ref + '</em>'];

  // Paginate
  const pages = [];
  let currentPage = '';
  let currentWords = 0;

  for (const token of tokens) {
    if (token.type === 'chapter') {
      // Chapter headings start a new page only if we already have content
      if (currentWords > 50) {
        pages.push(currentPage.trim());
        currentPage = '';
        currentWords = 0;
      }
      currentPage += token.html;
    } else {
      currentPage += token.html;
      currentWords += token.wordCount || 0;
      if (currentWords >= wordsPerPage) {
        pages.push(currentPage.trim());
        currentPage = '';
        currentWords = 0;
      }
    }
  }
  if (currentPage.trim()) pages.push(currentPage.trim());

  return pages.length > 0 ? pages : ['<em>No text found.</em>'];
}
`;

fs.writeFileSync(outputFile, out, 'utf8');
console.log(`\nOutput written to: ${outputFile}`);
console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
