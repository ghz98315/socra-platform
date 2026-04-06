const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

const part1Cover = `  {
    id: 'part1-cover',
    title: '第一部分：道',
    isFree: true,
    order: 1.5,
    isPartCover: true,
    partId: 'part1',
    partLabel: '第一部分',
    partTitle: '道',
    partSubtitle: '我们对"出错"这件事，从根上理解错了',
    partSummary: '在讲任何方法之前，必须先把一件事想清楚：我们为什么会在同一类错误上反复栽跟头？不是孩子不努力，不是家长不用心，而是我们从一开始就接受了两个根本性的错误认知——"粗心"可以解释一切，以及"做对了"等于"学会了"。这两个认知，是所有无效努力的真正源头。这一部分不讲方法，只讲清楚问题出在哪里。看清楚问题，才知道要解决的是什么。',
    content: ''
  },`;

const part2Cover = `  {
    id: 'part2-cover',
    title: '第二部分：法',
    isFree: false,
    order: 4.5,
    isPartCover: true,
    partId: 'part2',
    partLabel: '第二部分',
    partTitle: '法',
    partSubtitle: '四套工具，各司其职，缺一不可',
    partSummary: '5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法来自不同领域，但在这套系统里彼此咬合，缺一个整个系统就会有漏洞。',
    content: ''
  },`;

const part3Cover = `  {
    id: 'part3-cover',
    title: '第三部分：术',
    isFree: false,
    order: 8.5,
    isPartCover: true,
    partId: 'part3',
    partLabel: '第三部分',
    partTitle: '术',
    partSubtitle: '在真实的家庭里，把这套系统跑起来',
    partSummary: '方法懂了，工具有了，但最难的问题还没有回答：明天早上，坐在孩子旁边，到底怎么做？这一部分从实战出发，把一道错题从发现到彻底通关的完整路径，拆成六个可以立刻执行的具体动作，同时解决另一个真实的问题：家长的正确站位在哪里。',
    content: ''
  },`;

const part4Cover = `  {
    id: 'part4-cover',
    title: '第四部分：器',
    isFree: false,
    order: 10.5,
    isPartCover: true,
    partId: 'part4',
    partLabel: '第四部分',
    partTitle: '器',
    partSubtitle: '工具是最后一层，不是第一层',
    partSummary: '有了道、法、术，才轮到谈工具。手工工具能走多远？电子系统应该在什么时候出现、出现来做什么？核心原则只有一条：需要人思考的，永远留给人；不需要人判断的管理工作，才值得交给工具。没有前面的理解，再好的工具也只是另一个吃灰的App。',
    content: ''
  },`;

// Insert part1Cover before ch1
content = content.replace(/(\{\s*id:\s*'ch1')/, `${part1Cover}\n  $1`);
// Insert part2Cover before ch4
content = content.replace(/(\{\s*id:\s*'ch4')/, `${part2Cover}\n  $1`);
// Insert part3Cover before ch8
content = content.replace(/(\{\s*id:\s*'ch8')/, `${part3Cover}\n  $1`);
// Insert part4Cover before ch10
content = content.replace(/(\{\s*id:\s*'ch10')/, `${part4Cover}\n  $1`);

// Update local storage key
content = content.replace(/socrates_book_chapters_v4/g, 'socrates_book_chapters_v5');

fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Added part covers successfully.');
