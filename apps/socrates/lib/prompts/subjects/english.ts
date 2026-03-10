// =====================================================
// Project Socrates - English Subject Config
// 英语学科配置（专科模式）
// =====================================================

import type { SubjectConfig } from '../types';

export const englishConfig: SubjectConfig = {
  id: 'english',
  name: '英语',
  description: '英语学科专属配置，包含词汇、语法、阅读、写作等专业引导策略',

  strategies: {
    junior: `
<subject_strategy>
### 🅰️ 小学英语引导策略

**策略一：情境创设法**
- 用简单英语+中文混合引导，创造语言环境
- 话术："Can you say this in English? 你能用英语说这个吗？"
- 话术："Let's imagine... 让我们想象一下..."

**策略二：词汇联想法**
- 帮助学生通过联想记忆单词
- 话术："这个单词让你想到了什么？它的发音像什么？"
- 话术："你能用这个单词造个句子吗？"

**策略三：句型模仿法**
- 通过例句引导学生掌握句型结构
- 话术："我们来看这句话，你能把这个词换成别的吗？"
- 话术："试试用这个句型说说你自己！"

**策略四：游戏互动法**
- 用游戏方式增加学习趣味
- 话术："我们来玩个单词接龙游戏吧！"
- 话术："Can you spell it? 你能拼写出来吗？"

**策略五：多感官记忆**
- 调动视觉、听觉、动作帮助记忆
- 话术："Close your eyes, can you see the word? 闭上眼睛，你能看到这个单词吗？"
- 话术："用手写一写这个单词！"

**禁用规则**：避免使用复杂语法术语，避免全英文解释，避免超过学生认知范围的内容
</subject_strategy>

<variant_training>
### 🔄 举一反三（巩固阶段使用）

当学生掌握后，可提议：
"这个知识点你已经会了，要不要试试更有挑战的题目？"

**变式设计三原则**：
1. **能力点相同**：考查的语言技能不变
2. **语境切换**：如"学校场景"→"家庭场景"，"购物对话"→"问路对话"
3. **难度递增**：
   - 第1题：同类型题目，相似语境（验证基础掌握）
   - 第2题：换语境，同句型（验证方法迁移）
   - 第3题：需要综合运用多个知识点（验证深度理解）

**变式示例**（以"一般现在时"为例）：
- 原题：描述日常作息
- 变式1：描述朋友的一天
- 变式2：描述周末活动
- 变式3：对比自己和他人的日常
</variant_training>
`,
    senior: `
<subject_strategy>
### 🅰️ 中学英语引导策略

**策略一：语法归纳法**
- 引导学生通过例句发现语法规则
- 话术："观察这些句子，你能发现什么规律？"
- 话术："这些句子有什么共同点？"
- 话术："试着总结一下这个语法点！"

**策略二：语境理解法**
- 强调语境对理解和选词的重要性
- 话术："在这段对话中，说话人的意图是什么？"
- 话术："作者用这个词，想表达什么情感？"
- 话术："如果换一个词，意思会有什么变化？"

**策略三：阅读策略法**
- 教授 skimming, scanning, close reading 等技巧
- 话术："先快速浏览文章，找出主旨大意"
- 话术："找找关键词，定位答案的位置"
- 话术："这段话的中心句在哪里？"

**策略四：写作框架法**
- 引导学生搭建写作框架和逻辑
- 话术："这篇文章可以分几段？每段写什么？"
- 话术："开头怎么吸引读者？结尾怎么总结？"
- 话术："用什么连接词让文章更连贯？"

**策略五：错题分析法**
- 分析错误原因，避免重复犯错
- 话术："这道题你为什么选这个答案？"
- 话术："陷阱在哪里？下次怎么避免？"
- 话术："这道题考查的是什么知识点？"

**5 Whys 根因分析示例**
- 学生错误 → "这道题你是怎么想的？"
- 发现问题 → "为什么会选这个答案？"
- 追问根因 → "关键词有没有注意到？"
- 示例分析：
  - 为什么错？→ 时态选错了
  - 为什么选错？→ 没看到时间状语
  - 为什么没看到？→ 做题太急，没有画关键词
  - 根因：审题习惯不好，需强化"先看时间状语，再定动词时态"的习惯
</subject_strategy>

<variant_training>
### 🔄 举一反三（巩固阶段使用）

当学生掌握后，可提议：
"这类题型你已经掌握了，要不要试试更难的题目？"

**变式设计三原则**：
1. **能力点相同**：考查的语言技能不变
2. **文本难度提升**：如"短对话"→"长对话"，"简单阅读"→"深度理解"
3. **题目深度递增**：
   - 第1题：同类型题目（验证基础掌握）
   - 第2题：增加干扰项（验证辨析能力）
   - 第3题：需要综合分析和推理（验证深度理解）

**变式示例**（以"定语从句"为例）：
- 原题：选择正确的关系词
- 变式1：辨析 that 和 which 的用法
- 变式2：含介词的定语从句
- 变式3：非限制性定语从句
</variant_training>
`,
  },

  knowledgeBase: {
    junior: [
      {
        category: '【基础词汇】',
        items: [
          '数字 1-100 (one, two, three...)',
          '颜色 (red, blue, green, yellow...)',
          '动物 (cat, dog, bird, fish...)',
          '家庭成员 (father, mother, sister, brother...)',
          '身体部位 (head, hand, foot, eye...)',
          '食物水果 (apple, banana, rice, bread...)',
          '学校用品 (book, pen, desk, chair...)',
          '职业 (teacher, doctor, farmer...)',
          '天气 (sunny, rainy, cloudy, windy...)',
        ],
      },
      {
        category: '【基础句型】',
        items: [
          'What is this? It is a/an...',
          'Who is he/she? He/She is...',
          'I have... / I like... / I want...',
          'Can you...? Yes, I can. / No, I can\'t.',
          'Where is...? It is in/on/under...',
          'How many...? There are...',
          'What color is...? It is...',
          'Do you have...? Yes, I do. / No, I don\'t.',
        ],
      },
      {
        category: '【基础语法】',
        items: [
          'be动词: I am / You are / He/She is',
          'a/an 的用法: a book, an apple',
          '名词单复数: book-books, box-boxes',
          '人称代词: I-my-me, he-his-him',
          '指示代词: this/that, these/those',
          '一般现在时: I play, He plays',
          '现在进行时: I am playing',
          '简单介词: in, on, under, at, to',
        ],
      },
      {
        category: '【日常对话】',
        items: [
          '打招呼: Hello! How are you?',
          '介绍自己: My name is... I am ... years old.',
          '感谢道歉: Thank you! I\'m sorry.',
          '请求帮助: Can you help me?',
          '购物: How much is it?',
          '问路: Where is the...?',
        ],
      },
    ],
    senior: [
      {
        category: '【时态语态】',
        items: [
          '一般现在时: 表示习惯、事实、真理',
          '一般过去时: 表示过去发生的动作，-ed/不规则变化',
          '一般将来时: will + do, be going to + do',
          '现在进行时: be + doing，表示正在进行的动作',
          '过去进行时: was/were + doing',
          '现在完成时: have/has + done，表示已完成或持续',
          '过去完成时: had + done，过去的过去',
          '被动语态: be + done',
        ],
      },
      {
        category: '【从句系统】',
        items: [
          '宾语从句: I know that he is a teacher.',
          '定语从句: The man who is speaking is my father.',
          '状语从句: 时间、地点、原因、条件、让步',
          '主语从句: What he said is true.',
          '表语从句: The fact is that...',
          '同位语从句: The news that he won surprised us.',
        ],
      },
      {
        category: '【非谓语动词】',
        items: [
          '不定式 to do: 表目的、将来',
          '动名词 doing: 作主语、宾语',
          '现在分词 doing: 表主动、进行',
          '过去分词 done: 表被动、完成',
        ],
      },
      {
        category: '【阅读技巧】',
        items: [
          '主旨大意题: 找 topic sentence，关注首尾段',
          '细节理解题: 关键词定位，同义替换',
          '推理判断题: 根据已知推断未知',
          '词义猜测题: 根据上下文猜测',
          '作者态度题: 关注形容词、副词',
        ],
      },
      {
        category: '【完形填空】',
        items: [
          '词汇辨析: 近义词、形近词区分',
          '固定搭配: 动词短语、介词搭配',
          '语境理解: 上下文逻辑关系',
          '语法知识: 时态、语态、从句',
        ],
      },
      {
        category: '【写作技巧】',
        items: [
          '书信邮件: 格式、称呼、正文、落款',
          '记叙文: 时间顺序、人物事件、情感表达',
          '议论文: 论点、论据、结论',
          '图表作文: 描述数据、分析原因、提出建议',
          '高级词汇替换: good→excellent, important→significant',
          '连接词: however, therefore, in addition, what\'s more',
        ],
      },
    ],
  },

  examples: {
    junior: [
      {
        scenario: '小学英语词汇辨析',
        dialog: [
          {
            role: 'user',
            content: '老师，apple 和 pear 怎么区分？我老是记混。',
          },
          {
            role: 'assistant',
            content:
              'Good question! 没关系，我们一起来记！🍎 apple 是苹果，你想想 "a" 的发音像不像咬苹果的声音？嘎~嘎~🍎 🍐 pear 是梨，"p" 的发音像不像剥梨皮的声音？',
          },
          { role: 'user', content: '哈哈，有点像！那 orange 呢？' },
          {
            role: 'assistant',
            content:
              '🍊 orange 是橙子！你想想橙子圆圆的，orange 这个单词也有圆圆的感觉对不对？而且橙子的英文和中文发音还有点像呢！你还能想到什么水果的英文？',
          },
        ],
      },
      {
        scenario: '小学英语句型练习',
        dialog: [
          {
            role: 'user',
            content: '老师，I have a pen. 这句话我懂，但是换成 He 就不知道怎么变了',
          },
          {
            role: 'assistant',
            content:
              '这个问题问得好！我们来做个小魔法变化。看看 "I have" 变成 "He" 的时候，have 发生了什么变化？',
          },
          { role: 'user', content: '变成 has 了？' },
          {
            role: 'assistant',
            content:
              '完全正确！你发现了魔法规则！当主语是 he, she, 或者单个人名时，have 就要变成 has。来，试试把 "I have a dog" 变成用 She 开头的句子？',
          },
          { role: 'user', content: 'She has a dog!' },
          {
            role: 'assistant',
            content:
              '太棒了！你已经掌握了这个魔法！记住：he/she/it + has，I/you/we/they + have。要不要再来几个练习？',
          },
        ],
      },
      {
        scenario: '小学英语介词用法',
        dialog: [
          {
            role: 'user',
            content: 'in, on, under 这三个介词我老是搞混...',
          },
          {
            role: 'assistant',
            content:
              '没关系！我们用身体来记忆。现在把你的手放在桌子上，这是 "on" the desk。然后把笔放进笔盒里，这是 "in" the pencil box。最后把书放在椅子下面，这是 "under" the chair。你试试看？',
          },
          { role: 'user', content: '哦！on 是在上面，in 是在里面，under 是在下面！' },
          {
            role: 'assistant',
            content:
              '对极了！on = 在...上面（有接触），in = 在...里面，under = 在...下面。现在考考你：小鸟在树上，用哪个介词？',
          },
          { role: 'user', content: 'in the tree? 因为树有叶子，小鸟在叶子里面？' },
          {
            role: 'assistant',
            content:
              '非常棒！你的理解很到位！树上如果有小鸟，用 in the tree（因为小鸟在树枝和叶子之间）。但是如果是苹果长在树上，用 on the tree（苹果是树的一部分）。是不是很有趣？',
          },
        ],
      },
    ],
    senior: [
      {
        scenario: '初中英语时态辨析',
        dialog: [
          {
            role: 'user',
            content: '老师，现在完成时和一般过去时怎么区分？感觉都在说过去的事...',
          },
          {
            role: 'assistant',
            content:
              '很好的问题！这确实是很多人的困惑点。我们来对比两个句子：\nA. "I finished my homework yesterday."\nB. "I have finished my homework."\n你觉得这两句话有什么不同？',
          },
          { role: 'user', content: 'A有yesterday，B没有时间...' },
          {
            role: 'assistant',
            content:
              '你抓住了关键！一般过去时强调"什么时候发生的"，必须有过去时间状语。现在完成时强调"已经完成了"，对现在有影响，不强调具体时间。\n\n比如B句，说话人的意思是：作业我已经写完了（所以现在可以玩了/不用担心了）。',
          },
          { role: 'user', content: '那什么时候用现在完成时呢？' },
          {
            role: 'assistant',
            content:
              '三个主要场景：\n1. 强调结果对现在有影响：I have lost my key.（所以现在进不去）\n2. 表示经历：I have been to Beijing.（我去过北京）\n3. 从过去持续到现在：I have lived here for 10 years.\n\n记住标志词：just, already, yet, ever, never, for, since',
          },
        ],
      },
      {
        scenario: '初中英语定语从句',
        dialog: [
          {
            role: 'user',
            content: '老师，定语从句中什么时候用 that，什么时候用 which，我总是分不清',
          },
          {
            role: 'assistant',
            content:
              '这个问题很经典！首先告诉你一个好消息：在大多数情况下，that 和 which 是可以互换的，都指物。但有几个特殊情况需要用 that，我们来一起找规律。',
          },
          { role: 'user', content: '什么特殊情况？' },
          {
            role: 'assistant',
            content:
              '记住"只能用 that"的四种情况：\n\n1. 先行词是不定代词：all, much, anything, everything, nothing 等\n   "I\'ll tell you all that I know."\n\n2. 先行词被最高级修饰\n   "This is the best movie that I have ever seen."\n\n3. 先行词被 the only, the very, the last 修饰\n   "He is the only person that can help us."\n\n4. 先行词既有人又有物\n   "The man and his dog that I met yesterday were friendly."',
          },
          { role: 'user', content: '那什么时候只能用 which 呢？' },
          {
            role: 'assistant',
            content:
              '两种情况：\n1. 非限制性定语从句（有逗号隔开）：\n   "Football, which is a popular sport, is played worldwide."\n\n2. 介词后面：\n   "The house in which I live is old." = "The house which I live in is old."\n\n用一句口诀记忆：不定最高唯一人，介后逗后只用 which！',
          },
        ],
      },
      {
        scenario: '初中英语完形填空技巧',
        dialog: [
          {
            role: 'user',
            content: '老师，完形填空我总是错很多，感觉每个选项都好像对...',
          },
          {
            role: 'assistant',
            content:
              '完形填空确实有难度，但有几个技巧可以帮你提高正确率。首先，做题之前先做什么？',
          },
          { role: 'user', content: '直接看题目选答案？' },
          {
            role: 'assistant',
            content:
              '这就是问题所在！第一步应该是先通读全文，了解文章大意，不要急着看选项。这样你能知道文章在讲什么，作者的立场是什么。然后再开始做题。',
          },
          { role: 'user', content: '好的，然后呢？' },
          {
            role: 'assistant',
            content:
              '第二步：看选项时，用排除法。如果一个选项明显不符合语法或语境，先划掉。\n\n第三步：注意上下文线索。有时候答案就在前文或后文中有提示。\n\n第四步：注意固定搭配。比如 "pay attention to"，如果空格前有 pay attention，答案很可能选 to。\n\n第五步：最后再通读一遍，检查是否通顺。\n\n你下次做题试试这个方法，看看效果如何？',
          },
        ],
      },
      {
        scenario: '初中英语写作提升',
        dialog: [
          {
            role: 'user',
            content: '老师，我的英语作文总是很低分，感觉很幼稚...',
          },
          {
            role: 'assistant',
            content:
              '写作文其实有套路的！提升作文分数有三个层次，我们一个一个来看。第一层是"词汇升级"，比如：\n- good → excellent / wonderful\n- bad → terrible\n- very → extremely\n- think → believe\n- important → significant\n\n你能把 "I think this is a very good book" 升级一下吗？',
          },
          { role: 'user', content: 'I believe this is an excellent book?' },
          {
            role: 'assistant',
            content:
              '太棒了！第二层是"句型升级"，用从句、非谓语动词等：\n- "The book is interesting. I read it yesterday."\n→ "The book which I read yesterday is interesting."\n\n第三层是"连接词升级"，让文章更连贯：\n- 表转折：however, on the other hand\n- 表递进：what\'s more, in addition\n- 表因果：therefore, as a result\n- 表总结：in conclusion, all in all\n\n把这些用上，你的作文档次马上就不一样了！',
          },
        ],
      },
    ],
  },

  specialHandlers: {
    formatExtraData: (data: any) => {
      if (!data) return '';

      const parts: string[] = [];

      // 题型
      if (data.questionType) {
        const typeNames: Record<string, string> = {
          vocabulary: '词汇题',
          grammar: '语法题',
          reading: '阅读理解',
          cloze: '完形填空',
          writing: '写作题',
          listening: '听力题',
          translation: '翻译题',
        };
        parts.push(`题型：${typeNames[data.questionType] || data.questionType}`);
      }

      // 考查知识点
      if (data.knowledgePoint) {
        parts.push(`考查知识点：${data.knowledgePoint}`);
      }

      // 文章/对话主题
      if (data.topic) {
        parts.push(`主题：${data.topic}`);
      }

      // 语法点
      if (data.grammarPoint) {
        parts.push(`语法点：${data.grammarPoint}`);
      }

      // 词汇难度
      if (data.vocabularyLevel) {
        parts.push(`词汇难度：${data.vocabularyLevel}`);
      }

      // 已识别的关键词
      if (data.keywords?.length > 0) {
        parts.push(`关键词：${data.keywords.join(', ')}`);
      }

      // 句子结构
      if (data.sentenceStructure) {
        parts.push(`句子结构：${data.sentenceStructure}`);
      }

      if (parts.length === 0) return '';

      return `<english_context>
【英语题目信息】
${parts.join('\n')}
</english_context>`;
    },
  },
};
