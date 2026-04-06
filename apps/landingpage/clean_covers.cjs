const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

// Remove all part covers
content = content.replace(/  \{\s*id:\s*'part1-cover'[\s\S]*?content:\s*''\n  \},?\n?/g, '');
content = content.replace(/  \{\s*id:\s*'part2-cover'[\s\S]*?content:\s*''\n  \},?\n?/g, '');
content = content.replace(/  \{\s*id:\s*'part3-cover'[\s\S]*?content:\s*''\n  \},?\n?/g, '');
content = content.replace(/  \{\s*id:\s*'part4-cover'[\s\S]*?content:\s*''\n  \},?\n?/g, '');

const part1Cover = "  {\\n" +
"    id: 'part1-cover',\\n" +
"    title: '第一部分：道',\\n" +
"    isFree: true,\\n" +
"    order: 1.5,\\n" +
"    isPartCover: true,\\n" +
"    partId: 'part1',\\n" +
"    partLabel: '第一部分',\\n" +
"    partTitle: '道',\\n" +
"    partSubtitle: '我们对\"出错\"这件事，从根上理解错了',\\n" +
"    partSummary: '在讲任何方法之前，必须先把一件事想清楚：我们为什么会在同一类错误上反复栽跟头？不是孩子不努力，不是家长不用心，而是我们从一开始就接受了两个根本性的错误认知——\"粗心\"可以解释一切，以及\"做对了\"等于\"学会了\"。这两个认知，是所有无效努力的真正源头。这一部分不讲方法，只讲清楚问题出在哪里。看清楚问题，才知道要解决的是什么。',\\n" +
"    content: ''\\n" +
"  },";

const part2Cover = "  {\\n" +
"    id: 'part2-cover',\\n" +
"    title: '第二部分：法',\\n" +
"    isFree: true,\\n" +
"    order: 4.5,\\n" +
"    isPartCover: true,\\n" +
"    partId: 'part2',\\n" +
"    partLabel: '第二部分',\\n" +
"    partTitle: '法',\\n" +
"    partSubtitle: '四套工具，各司其职，缺一不可',\\n" +
"    partSummary: '知道问题在哪里还不够，还需要真正能解决问题的方法。这一部分介绍四套工具——它们来自不同的领域，解决不同的问题，但在套学习系统里，它们彼此咬合，共同构成一条完整的闭环：5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法，不是凑在一起的工具箱，而是一套经过设计的系统。',\\n" +
"    content: ''\\n" +
"  },";

const part3Cover = "  {\\n" +
"    id: 'part3-cover',\\n" +
"    title: '第三部分：术',\\n" +
"    isFree: true,\\n" +
"    order: 8.5,\\n" +
"    isPartCover: true,\\n" +
"    partId: 'part3',\\n" +
"    partLabel: '第三部分',\\n" +
"    partTitle: '术',\\n" +
"    partSubtitle: '在真实的家庭里，把这套系统跑起来',\\n" +
"    partSummary: '方法懂了，工具有了，但最难的问题还没有回答：明天早上，我坐在孩子旁边，到底怎么做？这一部分从实战出发，把一道错题从发现到彻底通关的完整路径，拆成六个可以立刻执行的具体动作。同时解决另一个真实问题：家长应该站在哪里？不是发动机，不是旁观者，而是一个在正确时机出现、做完该做的事、然后退出去的变速箱。',\\n" +
"    content: ''\\n" +
"  },";

const part4Cover = "  {\\n" +
"    id: 'part4-cover',\\n" +
"    title: '第四部分：器',\\n" +
"    isFree: true,\\n" +
"    order: 10.5,\\n" +
"    isPartCover: true,\\n" +
"    partId: 'part4',\\n" +
"    partLabel: '第四部分',\\n" +
"    partTitle: '器',\\n" +
"    partSubtitle: '工具是最后一层，不是第一层',\\n" +
"    partSummary: '有了道、法、术，才轮到谈工具。手工工具能走多远？电子系统应该在什么时候出现、出来做什么？核心原则只有一条：需要人思考的，永远留给人；不需要人判断的管理工作，才值得交给工具。工具解放的是精力，不是思考本身。没有前面章节的理解，再好的工具也只是另一个花哨的App。',\\n" +
"    content: ''\\n" +
"  },";

// Insert part1Cover before ch1
content = content.replace(/(  \{\s*id:\s*'ch1',)/, part1Cover + "\\n$1");

// Insert part2Cover before ch4
content = content.replace(/(  \{\s*id:\s*'ch4',)/, part2Cover + "\\n$1");

// Insert part3Cover before ch8
content = content.replace(/(  \{\s*id:\s*'ch8',)/, part3Cover + "\\n$1");

// Insert part4Cover before ch10
content = content.replace(/(  \{\s*id:\s*'ch10',)/, part4Cover + "\\n$1");

// Update localStorage key
content = content.replace(/socrates_book_chapters_v9/g, 'socrates_book_chapters_v10');

fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Cleaned up and re-inserted part covers.');
