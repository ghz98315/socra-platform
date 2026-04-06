const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

const appendixChapter = `  { 
    id: 'appendix', 
    title: '附录：Socrates 系统实操指南', 
    isFree: false, 
    order: 14,
    summary: '如何将书中的理念，在 Socrates 错题系统中完美落地。',
    content: \`<p>本章内容正在撰写中...</p>\`
  }
];`;

const newContent = content.replace(/\];/, `,\n${appendixChapter}`);
const finalContent = newContent.replace(/socrates_book_chapters_v3/g, 'socrates_book_chapters_v4');

fs.writeFileSync('src/lib/useBookChapters.ts', finalContent);
console.log('Added appendix successfully.');
