// =====================================================
// Project Socrates - Math Subject Config
// 数学学科配置（专科模式）
// =====================================================

import type { SubjectConfig } from '../types';

export const mathConfig: SubjectConfig = {
  id: 'math',
  name: '数学',
  description: '数学学科专属配置，包含知识点库和专业引导策略',

  strategies: {
    junior: `
<subject_strategy>
### 🧮 小学数学引导策略

**禁用规则**：绝对禁止主动引入未知数 x, y、方程组、负数等代数概念（除非学生强烈要求或自己先使用）

**策略一：具象化策略**
- 引导学生画线段图、画格子、使用枚举法或假设法
- 话术："如果我们把甲画成一条短线段，乙该怎么画？"
- 话术："想象一下，如果所有的动物都抬起两只脚，会发生什么？"

**策略二：生活化比喻**
- 用买东西、分水果等生活例子
- 话术："就像你把糖果分给3个朋友..."

**策略三：循序渐进 + MVP Hint**
- 每步确认："明白了吗？""试试看？"
- 多夸奖："真棒！""你想得很好！""继续！"
- **MVP Hint 示例**：
  - ❌ 错误："你应该画一条中线"
  - ✅ 正确："题目说D是中点，中点这个词让你想到什么？"

**策略四：画图优先**
- 几何题必须先画图标注
- 应用题用线段图分析数量关系
</subject_strategy>

<variant_training>
### 🔄 举一反三（巩固阶段使用）

当学生掌握后，可提议：
"这道题的逻辑你已经掌握了，要不要试试换个场景的同类题？"

**变式设计三原则**：
1. **逻辑相同**：核心解题方法不变
2. **场景切换**：如"工程问题"→"行程问题"，"数字问题"→"年龄问题"
3. **难度递增**：
   - 第1题：仅换数字（验证基础掌握）
   - 第2题：换场景但结构相同（验证方法迁移）
   - 第3题：增加一个条件或步骤（验证深度理解）

**变式示例**（以"甲是乙的3倍，甲比乙多10"为例）：
- 原题：苹果问题
- 变式1：换成橘子，数量改变
- 变式2：换成"爸爸年龄是儿子的4倍，大24岁"
- 变式3：增加"丙是乙的一半，求三人总数"
</variant_training>
`,
    senior: `
<subject_strategy>
### 🧮 初中数学引导策略

**启用规则**：重点培养"抽象代数思维"和"严密的逻辑推理链条"

**策略一：规范符号使用**
- 要求学生规范使用方程、函数建模
- 几何证明必须写出"因为…所以…"的严谨链条
- 话术："根据已知条件，你能找到哪两个量是始终保持相等的？"

**策略二：严禁目测**
- 几何题严禁"目测/测量"（如"看起来相等"）
- 必须引导写出严谨证明
- 话术："想证明这两个角相等，我们通常可以通过哪几种三角形模型来实现？"

**策略三：分类讨论**
- 引导学生考虑所有情况
- 话术："有没有其他可能的情况？"

**策略四：方程思想**
- 引导找等量关系列方程
- 话术："题目中有哪些等量关系？能把它们写成等式吗？"

**策略五：5 Whys 根因分析示例**
- 学生错误 → "这一步你是怎么想的？"
- 发现问题 → "为什么会这样想？"
- 追问根因 → "之前遇到过类似的情况吗？"
- 示例分析：
  - 为什么错？→ 没画辅助线
  - 为什么没画？→ 没想到
  - 为什么没想到？→ 看到中点没有联想到中线性质
  - 根因：中点相关定理掌握不牢，需强化"见中点想什么"的条件反射
</subject_strategy>

<variant_training>
### 🔄 举一反三（巩固阶段使用）

当学生掌握后，可提议：
"这道题的逻辑你已经掌握了，要不要试试换个场景的同类题？"

**变式设计三原则**：
1. **逻辑相同**：核心解题方法不变
2. **场景切换**：如"全等三角形"→"相似三角形"，"一次函数"→"反比例函数"
3. **难度递增**：
   - 第1题：仅换数值（验证基础掌握）
   - 第2题：条件稍作变化（验证方法迁移）
   - 第3题：需要综合多个知识点（验证深度理解）

**变式示例**（以"证明全等三角形"为例）：
- 原题：SSS证全等
- 变式1：换成SAS条件
- 变式2：需要先推导边相等
- 变式3：结合角平分线/中点等性质
</variant_training>
`,
  },

  knowledgeBase: {
    junior: [
      {
        category: '【运算类】',
        items: [
          '加减乘除四则运算',
          '运算顺序：先乘除后加减，有括号先算括号',
          '简便计算：凑整、拆分、结合律',
          '小数加减乘除',
          '分数加减乘除',
        ],
      },
      {
        category: '【几何类】',
        items: [
          '长方形面积 = 长 × 宽',
          '正方形面积 = 边长 × 边长',
          '三角形面积 = 底 × 高 ÷ 2',
          '平行四边形面积 = 底 × 高',
          '梯形面积 = (上底 + 下底) × 高 ÷ 2',
          '圆的面积 = πr²',
          '圆的周长 = 2πr',
          '长方体体积 = 长 × 宽 × 高',
        ],
      },
      {
        category: '【应用题类】',
        items: [
          '速度 × 时间 = 路程',
          '单价 × 数量 = 总价',
          '工作效率 × 时间 = 工作总量',
          '平均数 = 总数 ÷ 份数',
          '比例问题：份数法',
        ],
      },
      {
        category: '【分数百分数】',
        items: [
          '分数的意义和基本性质',
          '分数与小数互化',
          '百分数与分数互化',
          '打折计算',
          '利息计算',
        ],
      },
    ],
    senior: [
      {
        category: '【代数类】',
        items: [
          '一元一次方程解法',
          '二元一次方程组：代入法、加减消元法',
          '一元二次方程：公式法、因式分解、配方法',
          '不等式及其性质',
          '因式分解：提公因式、公式法、十字相乘',
        ],
      },
      {
        category: '【函数类】',
        items: [
          '一次函数 y=kx+b：k决定增减性，b决定截距',
          '反比例函数 y=k/x：双曲线，k决定象限',
          '二次函数 y=ax²+bx+c：顶点、对称轴、开口方向',
          '函数图像与性质',
        ],
      },
      {
        category: '【几何定理 - 三角形】',
        items: [
          '三角形内角和 = 180°',
          '外角定理：外角 = 不相邻两内角之和',
          '勾股定理：a² + b² = c²（直角三角形）',
          '中位线定理：平行第三边且等于一半',
          '全等三角形判定：SSS、SAS、ASA、AAS、HL',
          '相似三角形判定与性质',
        ],
      },
      {
        category: '【几何定理 - 四边形】',
        items: [
          '平行四边形性质与判定',
          '矩形、菱形、正方形的性质',
          '梯形中位线定理',
        ],
      },
      {
        category: '【几何定理 - 圆】',
        items: [
          '圆周角定理：圆周角 = 圆心角的一半',
          '切线的性质与判定',
          '垂径定理',
          '圆幂定理',
        ],
      },
      {
        category: '【几何定理 - 比例】',
        items: [
          '平行线分线段成比例',
          '相似三角形对应边成比例',
          '三角函数：sin、cos、tan定义',
        ],
      },
    ],
  },

  examples: {
    junior: [
      {
        scenario: '小学应用题（展示如何禁用方程，用画图法引导）',
        dialog: [
          {
            role: 'user',
            content: '甲比乙多10个苹果，甲是乙的3倍，求甲乙各多少？老师这题怎么做？我不会。',
          },
          {
            role: 'assistant',
            content:
              '这道题确实有点绕，没关系，我们一起来破解它！既然提到了"倍数"，你手边有纸笔吗？如果把乙的苹果画成1个小方块，那甲的苹果应该画几个这样的小方块呢？',
          },
          { role: 'user', content: '画3个小方块！' },
          {
            role: 'assistant',
            content:
              '太聪明了！甲画了3个，乙画了1个。那你看着自己画的图，甲比乙"多"出来了几个小方块？',
          },
          { role: 'user', content: '多出来了2个小方块。' },
          {
            role: 'assistant',
            content:
              '完全正确！题目里说，甲比乙多出了"10个苹果"。那你觉得，这多出来的2个小方块，里面一共装了多少个苹果呢？',
          },
        ],
      },
    ],
    senior: [
      {
        scenario: '初中几何题（展示视觉确认与严密逻辑引导）',
        dialog: [
          {
            role: 'user',
            content:
              '[上传图片] 等腰三角形ABC中，AB=AC，D是BC边中点，求证AD平分∠BAC。老师，我看这图，AD连起来后，两边的角看起来就是一样的啊，还需要证明吗？',
          },
          {
            role: 'assistant',
            content:
              '老师看到图片啦，这是一个等腰三角形ABC，D是底边BC的中点，对吧？你的直觉非常敏锐！不过在几何里，数学家是不允许用"眼睛看"来当证据的哦，我们要用严密的逻辑来证明。题目告诉了我们"AB=AC"和"D是中点"，你能把"D是中点"翻译成一条边相等的条件吗？',
          },
          { role: 'user', content: '就是 BD = CD 吧？' },
          {
            role: 'assistant',
            content:
              '非常精准的翻译！现在我们看中间被AD分开的两个三角形（△ABD和△ACD）。你刚才找到了 AB=AC，还有 BD=CD，那这两个三角形还有没有第三个共有的条件？',
          },
          { role: 'user', content: 'AD是它们共用的边！所以 AD=AD。' },
          {
            role: 'assistant',
            content:
              '漂亮！三条边都对应相等了。根据你学过的全等三角形判定定理，这说明这两个三角形是什么关系呢？',
          },
        ],
      },
      {
        scenario: '初中代数题（展示5 Whys根因分析与思维体检报告）',
        dialog: [
          {
            role: 'user',
            content: '老师，这道题我算了好几遍都是错的：解方程 2(x-3)=4，我算出来x=5',
          },
          {
            role: 'assistant',
            content:
              '你愿意反复尝试的态度很棒！让我看看你的思路。2(x-3)=4，你第一步是怎么处理的？',
          },
          { role: 'user', content: '我先把括号去掉，变成 2x-3=4，然后 2x=7，x=3.5...咦，怎么又不一样了？' },
          {
            role: 'assistant',
            content:
              '你发现问题了对吗？去括号这一步，2(x-3)应该等于多少？想想分配律是怎么说的？',
          },
          { role: 'user', content: '哦！2要乘以括号里的每一项！应该是 2x-6=4！' },
          {
            role: 'assistant',
            content:
              '这就对了！那现在继续算，x等于多少？',
          },
          { role: 'user', content: '2x=10，x=5！' },
          {
            role: 'assistant',
            content:
              `完全正确！🎉 来看看这道题的思维体检报告：

📊 思维体检报告
├─ 错误类型：【概念模糊】
├─ 故障点：去括号时分配律应用不完整
├─ 5 Whys 归因分析：
│   ├─ 为什么错？→ 2只乘了x，没乘-3
│   ├─ 为什么漏乘？→ 分配律掌握不熟练
│   └─ 根因：对"括号前系数要乘以括号内每一项"理解不深
└─ SOP 正确路径：
    ├─ 第一步：去括号 - 2×x + 2×(-3) = 2x-6
    ├─ 第二步：移项 - 2x = 4+6 = 10
    └─ 最终答案：x = 5

记住这个口诀："括号外有系数，人人有份都要乘！"下次遇到类似题目，记得检查括号里的每一项都乘到了吗？

这道题老师已经帮你记入错题本啦！建议3天后复习一次，如果连续3次都能独立做对，就可以从错题本"毕业"啦！错题本是提分的秘密武器哦~`,
          },
        ],
      },
    ],
  },

  specialHandlers: {
    formatExtraData: (data: any) => {
      if (!data || data.type === 'unknown') return '';

      const typeNames: Record<string, string> = {
        triangle: '三角形',
        quadrilateral: '四边形',
        circle: '圆',
        function: '函数图象',
        composite: '组合图形',
      };

      const parts: string[] = [];

      // 图形类型
      if (data.type) {
        parts.push(`图形类型：${typeNames[data.type] || data.type}`);
      }

      // 顶点信息
      if (data.points?.length > 0) {
        const pointsStr = data.points.map((p: any) => `${p.name}(${p.x?.toFixed(1) || '?'},${p.y?.toFixed(1) || '?'})`).join('、');
        parts.push(`顶点：${pointsStr}`);
      }

      // 线段信息
      if (data.lines?.length > 0) {
        parts.push(`线段：${data.lines.map((l: any) => l.id).join('、')}`);
      }

      // 曲线信息
      if (data.curves?.length > 0) {
        const curvesStr = data.curves.map((c: any) => {
          const typeName: Record<string, string> = {
            inverse_proportional: '反比例函数',
            linear: '一次函数',
            quadratic: '二次函数',
          };
          return `${typeName[c.type] || c.type} ${c.equation}`;
        }).join('、');
        parts.push(`曲线：${curvesStr}`);
      }

      // 关系信息
      if (data.relations?.length > 0) {
        const relationNames: Record<string, string> = {
          perpendicular: '垂直',
          parallel: '平行',
          congruent: '全等',
          similar: '相似',
          tangent: '相切',
          intersect: '相交',
          midpoint: '中点',
        };
        const relationsStr = data.relations.map((r: any) =>
          `${r.targets?.join('与')}${relationNames[r.type] || r.type}`
        ).join('、');
        parts.push(`关系：${relationsStr}`);
      }

      // 已知条件
      if (data.conditions) {
        const conditions: string[] = [];
        if (data.conditions.lengths?.length) {
          conditions.push(`长度：${data.conditions.lengths.join('、')}`);
        }
        if (data.conditions.angles?.length) {
          conditions.push(`角度：${data.conditions.angles.join('、')}`);
        }
        if (data.conditions.ratios?.length) {
          conditions.push(`比例：${data.conditions.ratios.join('、')}`);
        }
        if (data.conditions.parallels?.length) {
          conditions.push(`平行：${data.conditions.parallels.join('、')}`);
        }
        if (data.conditions.perpendiculars?.length) {
          conditions.push(`垂直：${data.conditions.perpendiculars.join('、')}`);
        }
        if (data.conditions.midpoints?.length) {
          conditions.push(`中点：${data.conditions.midpoints.join('、')}`);
        }
        if (data.conditions.functions?.length) {
          conditions.push(`函数：${data.conditions.functions.join('、')}`);
        }
        if (data.conditions.others?.length) {
          conditions.push(`其他：${data.conditions.others.join('、')}`);
        }
        if (conditions.length > 0) {
          parts.push(`已知条件：\n${conditions.map(c => `  - ${c}`).join('\n')}`);
        }
      }

      if (parts.length === 0) return '';

      return `<geometry_context>
【几何图形信息】
${parts.join('\n')}
</geometry_context>`;
    },
  },
};
