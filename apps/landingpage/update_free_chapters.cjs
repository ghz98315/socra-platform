const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

// Set isFree: true for all chapters
content = content.replace(/isFree:\s*false/g, 'isFree: true');

// Update localStorage key to force refresh
content = content.replace(/socrates_book_chapters_v7/g, 'socrates_book_chapters_v8');

fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Set all chapters to free and updated storage key.');
