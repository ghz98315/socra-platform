export type DevelopmentProgressStatus = 'completed' | 'in_progress' | 'pending';

export interface DevelopmentProgressItem {
  id: string;
  title: string;
  status: DevelopmentProgressStatus;
  summary: string;
  tasks: string[];
}

export interface DevelopmentProgressGroup {
  id: string;
  title: string;
  description: string;
  items: DevelopmentProgressItem[];
}

export interface DevelopmentProgressHighlight {
  id: string;
  title: string;
  description: string;
}

export const developmentProgressUpdatedAt = '2026-03-18';

export const developmentProgressHighlights: DevelopmentProgressHighlight[] = [
  {
    id: 'registry-meta',
    title: 'Registry 元数据继续收口',
    description:
      '模块页的阶段说明与实施原则开始从页面层收回 module registry，后续扩展更多模块时不再继续把展示文案写死在页面里。',
  },
  {
    id: 'result-contract',
    title: '结果动作 contract 开始统一',
    description:
      'V2 工作台的结果摘要 payload、详情 / 报告跳转和复习桥接动作开始改用共享 helper 与结果动作组件，页面层重复逻辑继续下降。',
  },
  {
    id: 'session-runtime',
    title: 'Session runtime 开始收口',
    description:
      '中文分析、写作和英语听力 V2 工作台已开始共用统一的 study asset session runtime，减少页面层重复的会话与持久化逻辑。',
  },
  {
    id: 'study-actions',
    title: '写作与听力后链路补齐',
    description:
      '写作和英语听力工作台都已补上统一学习记录详情、聚焦报告和加入复习入口，不再只停留在结果卡。',
  },
  {
    id: 'essay-history-bridge',
    title: '作文历史开始并回主平台',
    description:
      '作文批改模块页已切到新的 Essay history bridge，可把旧作文映射回 study assets，并进入详情、报告和复习链路。',
  },
  {
    id: 'study-report-review',
    title: 'Study / Report / Review 主链已可串联',
    description:
      '统一学习记录详情、复习桥接和 focus asset 报告入口都已落地，内测已能围绕单条学习资产继续流转。',
  },
];

export const developmentProgressGroups: DevelopmentProgressGroup[] = [
  {
    id: 'foundation',
    title: '平台底座',
    description: '先把统一学习入口、旧链路兼容和导航骨架做稳，避免多学科推进时把现有闭环打断。',
    items: [
      {
        id: 'study-domain',
        title: '统一学习域 /study',
        status: 'completed',
        summary:
          '学习中心、学科页、模块页、历史中心和详情回看都已落地，新的多学科入口不再依赖单一 workbench。',
        tasks: ['统一学习入口已切到 /study', '学科与模块路由已稳定可用', '历史中心与详情页已接入主导航'],
      },
      {
        id: 'legacy-loop',
        title: '旧链路兼容保护',
        status: 'completed',
        summary:
          '继续学习、会话恢复、错题详情、复习详情和旧作文外跳都还保留，当前推进没有靠破坏旧链路换新结构。',
        tasks: ['错题与复习可继续回到学习链路', 'legacy chat / essay 已能懒同步进统一记录层', '旧入口仍能作为兜底路径使用'],
      },
      {
        id: 'study-navigation',
        title: '学习域导航与总览',
        status: 'completed',
        summary:
          '学习中心、学习记录和学科内模块导航已经收口到统一结构，本轮继续把总进度视图同步到当前真实状态。',
        tasks: ['StudyDomainNav 已统一学习域外壳', '学科页保留模块导览与移动端切换', '总进度展示开始对齐最新阶段状态'],
      },
    ],
  },
  {
    id: 'subjects',
    title: '学科能力中心',
    description: '数学优先守稳定，语文继续收口，英语先把第一批可用工作台做成真正能回看与继续流转的主链。',
    items: [
      {
        id: 'math-geometry',
        title: '数学几何链路',
        status: 'completed',
        summary:
          '几何识别已严格限制为数学场景，手动加点、拖拽和辅助线能力已在现有链路中可用，当前不做高风险重写。',
        tasks: ['几何识别只在数学触发', '几何编辑能力保持可用', '后续优先做专项回归而不是重构'],
      },
      {
        id: 'chinese-center',
        title: '语文能力中心',
        status: 'in_progress',
        summary:
          '阅读理解、基础知识、作文思路和作文批改入口都已落地，且已接入统一学习记录、报告和复习的主平台动作。',
        tasks: ['阅读 / 基础知识工作台已 clean 化', '作文工作台结果卡已接详情 / 报告 / 复习', '旧作文历史已开始映射回 study assets'],
      },
      {
        id: 'english-center',
        title: '英语能力中心',
        status: 'in_progress',
        summary:
          '听力、写作思路和作文批改工作台都已形成独立入口，本轮又把结果页后的详情、报告和复习动作补齐。',
        tasks: ['英语听力工作台已接 study asset 后链路', '英语写作双模块已接详情 / 报告 / 复习', '后续补音频上传、播放器和更细分任务页'],
      },
    ],
  },
  {
    id: 'integration',
    title: '学习资产整合',
    description: '这部分目标不是一次性重构，而是持续把新旧链路往 study assets / reports / review 主平台收口。',
    items: [
      {
        id: 'study-asset-chain',
        title: '统一学习资产主链',
        status: 'in_progress',
        summary:
          'study assets、详情页、focus asset 报告、复习桥接和模块历史都已连起来，但还没有完成统一 Session 抽象。',
        tasks: ['新工作台都开始写入 study assets', '详情页可直接进入报告与复习', 'review bridge 已能为新学习资产派生复习记录'],
      },
      {
        id: 'essay-bridge',
        title: 'Essay 并入语文体系',
        status: 'in_progress',
        summary:
          '已经不只是外跳 Essay。作文批改模块页现在能把旧作文映射回 Socrates 主平台，并直接进入详情、报告和复习。',
        tasks: ['保留 Essay 作为深度工作台入口', '作文历史 bridge 已接回主平台链路', '后续继续提炼作文详情与资产结构'],
      },
      {
        id: 'legacy-compat',
        title: '多学科旧链路兼容',
        status: 'completed',
        summary:
          '错题本、复习、通知、PDF 和报告侧的基础兼容已经补齐语文与英语支持，不再只有数学能完整流转。',
        tasks: ['error-book 相关链路已补多学科支持', '报告与复习开始纳入 study assets', '旧链路回跳路径已保留'],
      },
      {
        id: 'session-model',
        title: '统一 Session / Registry 架构',
        status: 'in_progress',
        summary:
          '当前已经开始把模块页里的工作台接线、阶段说明和桥接补充收口到统一 registry，但真正统一的 StudySession 抽象还没完成。',
        tasks: ['模块页接线开始收口到统一 registry', '下一步继续提炼统一 Session 模型', '为物理、化学后续接入准备稳定扩展点'],
      },
    ],
  },
];

export const developmentProgressNextSteps = [
  '继续把页面层遗留的 review bridge 状态与结果卡说明收回共享组件，完成这一轮 result contract 收口。',
  '在共享 session runtime 之上继续抽离更多模块状态与 study asset payload 约定，向统一 StudySession 数据层推进。',
  '继续把旧作文详情里的更多结构化内容并回统一学习记录详情，而不只是卡片级桥接。',
  '继续把 registry 从模块页扩展到更多模块元数据，减少页面级硬编码。',
  '细化英语听力链路，决定音频上传、播放器和复练回放是否进入下一轮。',
  '切回 Node 20.x 并补跑 build / smoke，确认当前 study/report/review 主链在标准环境里稳定。',
  '在统一记录层之上继续抽取 StudySession 抽象，减少数据层的页面耦合。',
];

export function getDevelopmentProgressStats() {
  const items = developmentProgressGroups.flatMap((group) => group.items);
  const completed = items.filter((item) => item.status === 'completed').length;
  const inProgress = items.filter((item) => item.status === 'in_progress').length;
  const pending = items.filter((item) => item.status === 'pending').length;
  const total = items.length;
  const weighted =
    completed + inProgress * 0.6 + pending * 0;
  const progress = total === 0 ? 0 : Math.round((weighted / total) * 100);

  return {
    total,
    completed,
    inProgress,
    pending,
    progress,
  };
}
