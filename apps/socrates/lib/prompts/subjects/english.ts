// =====================================================
// Project Socrates - English Subject Config
// 英语学科配置（预留）
// =====================================================

import type { SubjectConfig } from '../types';

export const englishConfig: SubjectConfig = {
  id: 'english',
  name: '英语',
  description: '英语学科专属配置（预留，待后续完善）',

  strategies: {
    junior: `
<subject_strategy>
### 🅰️ 小学英语引导策略（预留）

**策略一：情境创设**
- 用简单英语+中文混合引导
- 话术："Can you say this in English? 你能用英语说这个吗？"

**策略二：词汇联想**
- 帮助学生记忆和联想单词
- 话术："这个单词让你想到了什么？"

**策略三：句型模仿**
- 通过例句引导学生掌握句型
- 话术："我们来看这句话，你能造一个类似的句子吗？"

**策略四：趣味互动**
- 用游戏方式学习
- 话术："我们来玩个单词接龙游戏吧！"
</subject_strategy>
`,
    senior: `
<subject_strategy>
### 🅰️ 中学英语引导策略（预留）

**策略一：语法归纳**
- 引导学生发现语法规则
- 话术："观察这些句子，你能发现什么规律？"

**策略二：语境理解**
- 强调语境对理解的重要性
- 话术："在这段对话中，说话人的意图是什么？"

**策略三：阅读策略**
- 教授skimming, scanning等技巧
- 话术："先快速浏览文章，找出主旨大意"

**策略四：写作框架**
- 引导学生搭建写作框架
- 话术："这篇文章可以分几段？每段写什么？"
</subject_strategy>
`,
  },

  knowledgeBase: {
    junior: [
      {
        category: '【基础词汇】',
        items: [
          '数字、颜色、动物',
          '家庭成员、身体部位',
          '食物、水果、饮料',
          '学校用品、职业',
        ],
      },
      {
        category: '【基础句型】',
        items: [
          'What is this? It is...',
          'I have... / I like...',
          'Can you...? Yes, I can.',
          'Where is...? It is...',
        ],
      },
      {
        category: '【基础语法】',
        items: [
          'be动词用法',
          '一般现在时',
          '名词单复数',
          '简单介词',
        ],
      },
    ],
    senior: [
      {
        category: '【时态语态】',
        items: [
          '一般现在时、一般过去时、一般将来时',
          '现在进行时、过去进行时',
          '现在完成时、过去完成时',
          '被动语态',
        ],
      },
      {
        category: '【从句】',
        items: [
          '宾语从句',
          '定语从句',
          '状语从句',
          '主语从句、表语从句',
        ],
      },
      {
        category: '【阅读技巧】',
        items: [
          '主旨大意题',
          '细节理解题',
          '推理判断题',
          '词义猜测题',
        ],
      },
      {
        category: '【写作类型】',
        items: [
          '书信邮件',
          '记叙文',
          '议论文',
          '图表作文',
        ],
      },
    ],
  },

  examples: {
    junior: [
      {
        scenario: '小学英语对话（预留）',
        dialog: [
          {
            role: 'user',
            content: '老师，apple和pear怎么区分？',
          },
          {
            role: 'assistant',
            content:
              'Good question! apple是苹果🍎，pear是梨🍐。你能告诉我，哪个是红色的，哪个是黄色的吗？',
          },
        ],
      },
    ],
    senior: [
      {
        scenario: '中学英语时态（预留）',
        dialog: [
          {
            role: 'user',
            content: '老师，现在完成时和一般过去时怎么区分？',
          },
          {
            role: 'assistant',
            content:
              '很好的问题！关键看时间状语和语境。你来看这个句子："I have finished my homework." 和 "I finished my homework yesterday." 这两句有什么不同？',
          },
        ],
      },
    ],
  },

  specialHandlers: {
    formatExtraData: (data: any) => {
      // 预留：可以处理英语文章、题目等
      if (!data) return '';
      return '';
    },
  },
};
