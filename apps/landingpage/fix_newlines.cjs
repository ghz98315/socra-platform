const fs = require('fs');
let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');
content = content.replace(/\\n/g, '\n');
fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Fixed newlines');
