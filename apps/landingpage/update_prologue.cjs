const fs = require('fs');

let content = fs.readFileSync('src/lib/useBookChapters.ts', 'utf8');

const newPrologueContent = "<p>那是一个普通的周末下午。</p>\\n" +
"<p>大宝坐在书桌前做几何题，我站在他身后看了一会儿。他把一道三角函数题的正弦值用成了余弦，整道题从第二步开始就全错了。</p>\\n" +
"<p>我问他：知道错在哪里吗？</p>\\n" +
"<p>他头也没抬：嗯，粗心了。</p>\\n" +
"<p>然后翻到下一题。</p>\\n" +
"<p>我站在那里，没说话。</p>\\n" +
"<p>在比亚迪做了十年工程管理，我经手过几百份质量异常报告。那十年里，<strong>没有任何一份报告允许把根因一栏填成\\"操作员粗心\\"</strong>。不是因为工人不会粗心，而是因为所有人都知道，一旦写下这两个字，这件事就结案了——没有人会再往下追，没有人会去找真正的原因，同样的问题还会在下个月、下下个月，用同样的方式重新出现在同一条生产线上。</p>\\n" +
"<p>我看着大宝翻页的那个动作，突然意识到：<strong>他刚才做的事，和那些填了\\"粗心\\"就交差的报告，没有任何本质区别。</strong></p>\\n" +
"<p>问题没有被找到，只是被关闭了。</p>\\n" +
"<div class=\\"p-6 border-l-4 border-[#e8600a] bg-[#fff5ee] my-8\\">\\n" +
"  <p class=\\"text-base italic leading-relaxed text-justify text-[#e8600a] opacity-80 m-0\\">这本书就是从那个下午开始的。不是因为那道几何题有多难，而是因为我忽然看清楚了一件事：我们对\\"出错\\"这件事的处理方式，从一开始就走偏了。</p>\\n" +
"</div>\\n" +
"<p>孩子说粗心，家长信了，老师也默许了。订正、签字、继续做下一题。整个流程看起来完整，实际上最关键的一步——搞清楚为什么会错——从来没有发生过。</p>\\n" +
"<p>这不是孩子的问题，也不是家长不负责任。是我们从来没有人告诉过他们：<strong>出错之后，真正该做的第一件事，不是赶紧改正，而是认真追问。</strong></p>\\n" +
"<p>我不是教育专家，也没有读过多少教育学的书。我是一个在流水线和项目管理里泡了十年的工程师，后来又做了几年创业，现在是两个孩子的爸。大宝十五岁，初三，正在备考中考。小宝十一岁，五年级，几何刚刚开始学，已经开始犯和大宝一模一样的错误。</p>\\n" +
"<p>在工厂解决问题，我们用5 Why——一个问题追问五次，直到找到真正的根因。我们用PDCA——计划、执行、检验、改进，循环不停，直到问题被真正关闭。这些方法我用了十年，用来管生产线、管项目、管团队。那个下午之后，我开始用它们来管孩子的错题。</p>\\n" +
"<p>结果出乎意料的有效。不是因为方法有多神奇，而是因为这些方法本来解决的就是同一类问题：<strong>如何让一个出现过的问题，真正不再出现。</strong></p>\\n" +
"<p>这本书里有四套方法，都不是我发明的。<strong>5 Why</strong>来自丰田，是汽车工厂追查质量问题的根因分析工具。<strong>PDCA</strong>也来自工厂管理，是让改进动作形成闭环而不是一次性冲刺的节奏框架。<strong>费曼学习法</strong>来自诺贝尔物理学家理查德·费曼，核心只有一句话：如果你不能用简单的语言把一件事解释清楚，说明你还没有真正理解它。<strong>艾宾浩斯遗忘曲线</strong>来自19世纪的心理学实验，告诉我们记忆会在可预测的时间节点衰退，而在对的时间点复习，可以用最小的代价把遗忘曲线拉平。</p>\\n" +
"<p>我做的事，是把它们迁移到学习场景里，用PDCA把它们串成一条完整的闭环。书的后半部分，我把这套闭环做成了一个工具系统。但我需要提前说清楚：<strong>工具是最后一环，不是第一步。</strong>如果你直接跳到工具那章，多半会觉得这不过是另一个学习App。只有先理解前面的逻辑，工具才会变得有意义。</p>\\n" +
"<div class=\\"bg-[#fff5ee] border border-[#ffe4d6] p-6 rounded-lg my-8\\">\\n" +
"  <h4 class=\\"text-[#e8600a] text-sm font-bold mb-4 flex items-center gap-2\\">\\n" +
"    <svg width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20\\"/></svg>\\n" +
"    这本书写给两类人\\n" +
"  </h4>\\n" +
"  <p class=\\"mb-4 text-[0.95rem] text-[#4a4a4a]\\">一类是像我一样的家长——认真，想把这件事真正想清楚，而不是跟着感觉催催催。另一类是已经开始独立思考自己学习方式的学生，大概是初中到高中这个阶段，足够成熟，也足够困惑。</p>\\n" +
"  <p class=\\"m-0 text-[0.95rem] text-[#4a4a4a]\\">如果你期待的是一套\\"照着做就能提分\\"的操作手册，这本书可能会让你失望。这里没有承诺，只有逻辑。但如果你也曾经看着孩子说出\\"粗心了\\"然后翻页，心里升起过一种说不清楚的不安——那我们从同一个地方开始。</p>\\n" +
"</div>\\n" +
"<p class=\\"italic text-[#666] text-[0.95rem] mt-12 pt-8 border-t border-[#eee]\\">那道几何题后来怎么样了？大宝最终搞清楚了正弦和余弦的本质区别，不是靠背公式，而是自己把推导过程重新走了一遍。他能用自己的话解释清楚为什么是正弦而不是余弦的那天，我知道这道题真的结束了。<br>那是三周后的事。</p>";

// Replace the prologue content
const prologueRegex = /(id:\s*'prologue'[\s\S]*?content:\s*`)([\s\S]*?)(`\n\s*},)/;
content = content.replace(prologueRegex, `$1${newPrologueContent}$3`);

// Update localStorage key to force refresh
content = content.replace(/socrates_book_chapters_v6/g, 'socrates_book_chapters_v7');

fs.writeFileSync('src/lib/useBookChapters.ts', content);
console.log('Prologue content updated.');
