const fs = require('fs');
const path = require('path');

const output = [];
let gapCount = 0;
for (const lang of ['am', 'ti']) {
  const langDir = path.join('public/data', lang);
  const books = fs.readdirSync(langDir).filter(f => !f.includes('.')).sort((a, b) => +a - +b);
  for (const book of books) {
    const bookDir = path.join(langDir, book);
    const chapters = fs.readdirSync(bookDir).filter(f => f.endsWith('.json')).sort((a, b) => +a.replace('.json', '') - +b.replace('.json', ''));
    for (const ch of chapters) {
      const data = JSON.parse(fs.readFileSync(path.join(bookDir, ch), 'utf-8'));
      const verses = data.verses;
      for (let i = 0; i < verses.length - 1; i++) {
        const currEnd = verses[i].verseEnd || verses[i].verse;
        const next = verses[i + 1].verse;
        if (next - currEnd > 1) {
          gapCount++;
          output.push(lang + '/' + book + '/' + ch + ': gap after verse ' + currEnd + ', next is ' + next);
        }
      }
    }
  }
}
output.push('\nTotal remaining gaps: ' + gapCount);
fs.writeFileSync('scripts/final-gap-report.txt', output.join('\n'), 'utf-8');

