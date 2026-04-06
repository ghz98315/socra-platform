const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

// Add chapterNumber to interface
content = content.replace(
  /order: number;/,
  'order: number;\n  chapterNumber?: number;'
);

// Update prologue
content = content.replace(
  /id: 'prologue',\n\s*title: '序言：那个说"粗心了"的下午',/,
  `id: 'prologue',\n    title: '序言：那个说"粗心了"的下午',\n    chapterNumber: 0,`
);

// Update ch1-ch12
for (let i = 1; i <= 12; i++) {
  const numStr = i.toString().padStart(2, '0');
  const regex = new RegExp(`id: 'ch${i}',\\s*title: '${numStr} (.*?)',`, 'g');
  content = content.replace(regex, `id: 'ch${i}', \n    title: '$1', \n    chapterNumber: ${i},`);
}

// Update appendix
content = content.replace(
  /id: 'appendix',\n\s*title: '附录：Socrates 系统实操指南',/,
  `id: 'appendix',\n    title: '附录：Socrates 系统实操指南',\n    chapterNumber: 13,`
);

content = content.replace(/socrates_book_chapters_v5/g, 'socrates_book_chapters_v6');

fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Added chapterNumber and cleaned titles.');
