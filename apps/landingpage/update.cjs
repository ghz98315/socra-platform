const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

const ch1ContentMatch = content.match(/id:\s*'ch1'[\s\S]*?content:\s*`([\s\S]*?)`\s*},/);
const ch2ContentMatch = content.match(/id:\s*'ch2'[\s\S]*?content:\s*`([\s\S]*?)`\s*},/);
const ch3ContentMatch = content.match(/id:\s*'ch3'[\s\S]*?content:\s*`([\s\S]*?)`\s*,\s*order:\s*3\s*}/);
const ch4ContentMatch = content.match(/id:\s*'ch4'[\s\S]*?content:\s*`([\s\S]*?)`\s*,\s*order:\s*4\s*}/);
const ch5ContentMatch = content.match(/id:\s*'ch5'[\s\S]*?content:\s*`([\s\S]*?)`\s*,\s*order:\s*5\s*}/);
const ch6ContentMatch = content.match(/id:\s*'ch6'[\s\S]*?content:\s*`([\s\S]*?)`\s*,\s*order:\s*6\s*}/);

const ch1Content = ch1ContentMatch ? ch1ContentMatch[1] : '';
const ch2Content = ch2ContentMatch ? ch2ContentMatch[1] : '';
const ch3Content = ch3ContentMatch ? ch3ContentMatch[1] : '';
const ch4Content = ch4ContentMatch ? ch4ContentMatch[1] : '';
const ch5Content = ch5ContentMatch ? ch5ContentMatch[1] : '';
const ch6Content = ch6ContentMatch ? ch6ContentMatch[1] : '';

const newChapters = `const DEFAULT_CHAPTERS: BookChapter[] = [
  {
    id: 'prologue',
    title: '序言：那个说"粗心了"的下午',
    isFree: true,
    order: 1,
    summary: '一道几何题，一句"粗心了"，一个做了十年质量管理的爸爸站在孩子身后的沉默。这本书，从那个下午开始。',
    content: \`<p>那是一个普通的周末下午。</p><p>大宝坐在书桌前做几何题，我站在他身后看了一会儿。他把一道三角函数题的正弦值用成了余弦，整道题从第二步开始就全错了。</p><p>我问他：知道错在哪里吗？</p><p>他头也没抬：嗯，粗心了。</p><p>然后翻到下一题。</p><p>我站在那里，没说话。</p><p>在比亚迪做了十年工程管理，我经手过几百份质量异常报告。那十年里，<strong>没有任何一份报告允许把根因栏填成"操作员粗心"</strong>。不是因为工人不会粗心，而是因为所有人都知道，一旦写下这两个字，这件事就结案了——没有人会再往下追问，也没有人会去改进流程。而那个导致粗心的真正漏洞，就安安稳稳地躺在那里，等着下一次爆发。</p><p>但在孩子的书桌前，"粗心了"这三个字，每天都在被轻易地说出，又被轻易地接受。</p><p>那个下午的沉默，是这本书的起点。我决定把工厂里那套用来对付复杂系统问题的硬核逻辑，搬到孩子的书桌旁边，看看能不能对付那些永远改不完的错题。</p>\`
  },
  { 
    id: 'ch1', 
    title: '01 粗心，是关闭追问的借口', 
    isFree: true, 
    order: 2,
    summary: '"粗心了"三个字一出口，根因就关上了门。在工厂，没有任何报告允许这样结案——因为写下这两个字的那一刻，同样的问题就已经预定了下次还会出现。',
    partId: 'part1',
    partLabel: '道',
    partTitle: '第一部分：我们对"出错"这件事，从根上理解错了',
    partSummary: '在讲任何方法之前，必须先把两个根本性的错误认知打破——"粗心"可以解释一切，"做对了"等于"学会了"。这两个认知，是所有无效努力的真正源头。看清楚问题出在哪里，才知道真正需要解决什么。',
    content: \`${ch1Content}\`
  },
  { 
    id: 'ch2', 
    title: '02 做对一次，不等于学会了', 
    isFree: true, 
    order: 3,
    summary: '产品下线检测通过，不等于出厂合格。"临时会"是学习里最危险的错觉——它会让所有人都以为这件事已经结束了，但真正的漏洞还在那里，等着下一次出现。',
    partId: 'part1',
    partLabel: '道',
    partTitle: '第一部分：我们对"出错"这件事，从根上理解错了',
    partSummary: '在讲任何方法之前，必须先把两个根本性的错误认知打破——"粗心"可以解释一切，"做对了"等于"学会了"。这两个认知，是所有无效努力的真正源头。看清楚问题出在哪里，才知道真正需要解决什么。',
    content: \`${ch2Content}\`
  },
  { 
    id: 'ch3', 
    title: '03 为什么那本错题本，从来没有真正起过作用', 
    isFree: false, 
    order: 4,
    summary: '一个只进不出的仓库，不是资产，是积压。大多数错题本记录的是症状，不是根因；有入口，没出口；做了很多动作，但这些动作从来没有被连成一条路。',
    partId: 'part1',
    partLabel: '道',
    partTitle: '第一部分：我们对"出错"这件事，从根上理解错了',
    partSummary: '在讲任何方法之前，必须先把两个根本性的错误认知打破——"粗心"可以解释一切，"做对了"等于"学会了"。这两个认知，是所有无效努力的真正源头。看清楚问题出在哪里，才知道真正需要解决什么。',
    content: \`${ch3Content}\`
  },
  { 
    id: 'ch4', 
    title: '04 向丰田借来的追问法——用5 Why找到错误的真正原因', 
    isFree: false, 
    order: 5,
    summary: '机器停了，换保险丝，下周还会停。真正的解决是问五个为什么，找到滤网堵塞的那个根因。一道题做错了，改正翻页，下次还会错。道理，完全一样。',
    partId: 'part2',
    partLabel: '法',
    partTitle: '第二部分：四套工具，各司其职，缺一不可',
    partSummary: '5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法来自不同领域，但在这套系统里彼此咬合，缺一个整个系统就会有漏洞。',
    content: \`${ch4Content}\`
  },
  { 
    id: 'ch5', 
    title: '05 费曼的那把尺子——"能讲清楚"才算真的懂了', 
    isFree: false, 
    order: 6,
    summary: '诺贝尔奖得主用一把尺子检验自己有没有真正理解一件事：能不能用简单的语言把它讲清楚。做出来，和讲清楚，是两件完全不同的事。后者，才是真正的判断标准。',
    partId: 'part2',
    partLabel: '法',
    partTitle: '第二部分：四套工具，各司其职，缺一不可',
    partSummary: '5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法来自不同领域，但在这套系统里彼此咬合，缺一个整个系统就会有漏洞。',
    content: \`${ch5Content}\`
  },
  { 
    id: 'ch6', 
    title: '06 艾宾浩斯的那条曲线——为什么复习的时机全错了', 
    isFree: false, 
    order: 7,
    summary: '学完二十分钟，已经忘了将近一半。不是孩子记性差，是遗忘曲线在正常工作。但在将要忘记、还没完全忘记的那个窗口复习——成本最低，效果最好。时机对了，一切不同。',
    partId: 'part2',
    partLabel: '法',
    partTitle: '第二部分：四套工具，各司其职，缺一不可',
    partSummary: '5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法来自不同领域，但在这套系统里彼此咬合，缺一个整个系统就会有漏洞。',
    content: \`<p>本章内容正在撰写中...</p>\`
  },
  { 
    id: 'ch7', 
    title: '07 PDCA——让这套系统真正转起来，而不是用一次就断掉', 
    isFree: false, 
    order: 8,
    summary: '这不是一个四步流程，而是一个持续进化的机制。计划是假设，执行是实验，检查是反馈，改进是调整。戴明把它带进日本，催生了丰田。现在，我们把它带进孩子的书桌旁边。',
    partId: 'part2',
    partLabel: '法',
    partTitle: '第二部分：四套工具，各司其职，缺一不可',
    partSummary: '5 Why负责找到真正的根因，费曼学习法负责验证理解是否真实建立，艾宾浩斯遗忘曲线负责在正确的时间节点固化记忆，PDCA把前三者串成一个不会断掉的管理循环。四个方法来自不同领域，但在这套系统里彼此咬合，缺一个整个系统就会有漏洞。',
    content: \`${ch6Content}\`
  },
  { 
    id: 'ch8', 
    title: '08 从一道错题到稳定掌握——这套系统在家里怎么真正跑起来', 
    isFree: false, 
    order: 9,
    summary: '六个动作，一条完整的路：闭卷重做找出真Bug，5 Why追问找到根因，根因打标建立图谱，防呆设计打上补丁，设定节点写进日历，费曼通关才算结束。顺序不能乱，每一步都有它的位置。',
    partId: 'part3',
    partLabel: '术',
    partTitle: '第三部分：在真实的家庭里，把这套系统跑起来',
    partSummary: '方法懂了，工具有了，但最难的问题还没有回答：明天早上，坐在孩子旁边，到底怎么做？这一部分从实战出发，把一道错题从发现到彻底通关的完整路径，拆成六个可以立刻执行的具体动作，同时解决另一个真实的问题：家长的正确站位在哪里。',
    content: \`<p>本章内容正在撰写中...</p>\`
  },
  { 
    id: 'ch9', 
    title: '09 家长的正确站位——不是发动机，而是变速箱', 
    isFree: false, 
    order: 10,
    summary: '家长一旦变成发动机，孩子就变成了被拉着走的拖车。真正有效的参与，是在孩子还有能力自己往前走的时候，忍住不出手；在真正需要支撑的时候，出现，做完，退出去。',
    partId: 'part3',
    partLabel: '术',
    partTitle: '第三部分：在真实的家庭里，把这套系统跑起来',
    partSummary: '方法懂了，工具有了，但最难的问题还没有回答：明天早上，坐在孩子旁边，到底怎么做？这一部分从实战出发，把一道错题从发现到彻底通关的完整路径，拆成六个可以立刻执行的具体动作，同时解决另一个真实的问题：家长的正确站位在哪里。',
    content: \`<p>本章内容正在撰写中...</p>\`
  },
  { 
    id: 'ch10', 
    title: '10 从纸笔到系统——什么该手工做，什么值得交给工具', 
    isFree: false, 
    order: 11,
    summary: '手工慢，但慢是优点——它逼你真正想清楚才能写下去。但三个月后，复习节点超过三十个，标签要手动统计，两个孩子的数据无法整合——这时候，工具该出现了。',
    partId: 'part4',
    partLabel: '器',
    partTitle: '第四部分：工具是最后一层，不是第一层',
    partSummary: '有了道、法、术，才轮到谈工具。手工工具能走多远？电子系统应该在什么时候出现、出现来做什么？核心原则只有一条：需要人思考的，永远留给人；不需要人判断的管理工作，才值得交给工具。没有前面的理解，再好的工具也只是另一个吃灰的App。',
    content: \`<p>本章内容正在撰写中...</p>\`
  },
  { 
    id: 'ch11', 
    title: '11 最难熬的那三周——让这套系统真正扎根', 
    isFree: false, 
    order: 12,
    summary: '第一周新鲜，第二周摩擦，第三周最难。那个说"算了"的声音出现的时候，正是这套系统离真正扎根最近的地方。不断，比什么都重要。',
    partId: 'part4',
    partLabel: '器',
    partTitle: '第四部分：工具是最后一层，不是第一层',
    partSummary: '有了道、法、术，才轮到谈工具。手工工具能走多远？电子系统应该在什么时候出现、出现来做什么？核心原则只有一条：需要人思考的，永远留给人；不需要人判断的管理工作，才值得交给工具。没有前面的理解，再好的工具也只是另一个吃灰的App。',
    content: \`<p>本章内容正在撰写中...</p>\`
  },
  { 
    id: 'epilogue', 
    title: '尾声·第十二章：两年之后——那个下午，以及它真正改变了什么', 
    isFree: false, 
    order: 13,
    summary: '两年后，大宝主动拿出纸，自己写下5 Why。这套思维方式，已经变成他自己的一部分。这才是一道错题，应该有的结局。',
    content: \`<p>本章内容正在撰写中...</p>\`
  }
];`;

const newContent = content.replace(/const DEFAULT_CHAPTERS: BookChapter\[\] = \[[\s\S]*?\];/, newChapters);

// Update local storage key to force reload
const finalContent = newContent.replace(/socrates_book_chapters_v2/g, 'socrates_book_chapters_v3');

fs.writeFileSync('src/lib/useBookChapters.ts', finalContent);
console.log('Updated useBookChapters.ts successfully.');
