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

export const developmentProgressUpdatedAt = '2026-03-16';

export const developmentProgressGroups: DevelopmentProgressGroup[] = [
  {
    id: 'foundation',
    title: '平台骨架',
    description: '先把统一学习入口、旧闭环保护和主路由迁移做稳，为多学科继续扩展留出空间。',
    items: [
      {
        id: 'study-domain',
        title: '统一学习域 /study',
        status: 'completed',
        summary: '已建立 study 首页、学科页、模块页和问题分析桥接页，开始承接原 workbench 的入口职责。',
        tasks: [
          '学习入口已切到 /study',
          '学科和模块路由骨架已建立',
          '题目分析先桥接到稳定 workbench',
        ],
      },
      {
        id: 'legacy-loop',
        title: '旧业务闭环保护',
        status: 'completed',
        summary: '继续学习链路、会话恢复、图片预览同步和旧页面跳转已补齐，没有打断原有可用流程。',
        tasks: [
          '错题详情和复习详情可继续进入学习',
          'session 恢复支持图片、OCR、聊天记录和学科',
          '上传组件可正确回显历史图片',
        ],
      },
      {
        id: 'study-navigation',
        title: '学习域导航升级',
        status: 'completed',
        summary: '共享顶层 StudyDomainNav 已落地，学习中心、学习记录、学科页和学科内模块导航开始统一到同一学习域结构。',
        tasks: [
          '/study 与 /study/history 已共用顶层导航',
          '学科页保留模块侧导航与移动端 chips',
          '新功能默认从学习域内扩展，不再直接散落全局顶栏',
        ],
      },
    ],
  },
  {
    id: 'subjects',
    title: '学科能力建设',
    description: '数学优先保稳定，语文先做深，英语先做出第一条专属主链。',
    items: [
      {
        id: 'math-geometry',
        title: '数学图形识别与几何画板',
        status: 'completed',
        summary: '几何识别已严格限制为数学专属流程，避免语文和英语误触发；画板已有手工加点和辅助线能力。',
        tasks: [
          '几何识别仅在数学触发',
          '支持手工加点、拖拽点位、添加辅助线',
          '后续需专项回归验证复杂图形场景',
        ],
      },
      {
        id: 'chinese-center',
        title: '语文能力中心',
        status: 'in_progress',
        summary: '语文录题分析已接入统一入口，阅读理解、基础知识、作文批改和写作思路都已有独立模块入口，但学习资产仍未完全统一。',
        tasks: [
          '阅读理解与基础知识工作台已落地',
          '作文批改桥接与写作思路已可直接使用',
          '后续继续统一作文与语文模块学习资产',
        ],
      },
      {
        id: 'english-center',
        title: '英语能力中心',
        status: 'in_progress',
        summary: '英语已形成录题分析、听力轻量版、写作批改和写作思路四个模块入口，下一步重点是把听力与写作结果继续并回学习资产。',
        tasks: [
          '听力轻量工作台已落地',
          '写作批改与写作思路已可直接使用',
          '后续再细分阅读、语法、完形等任务页并统一学习记录',
        ],
      },
    ],
  },
  {
    id: 'integration',
    title: '能力整合与长期架构',
    description: '这部分不追求一次性重构，目标是逐步把 Essay 能力和多模块学习资产并回 Socrates 主平台。',
    items: [
      {
        id: 'essay-bridge',
        title: 'Essay 并入语文体系',
        status: 'in_progress',
        summary: '当前已完成作文批改入口桥接，下一步是统一作文历史、报告和学习资产，不直接粗暴搬迁整站。',
        tasks: [
          '保留 Essay 独立入口作为专题壳',
          '语文内提供作文批改桥接',
          '后续抽离作文核心能力层',
        ],
      },
      {
        id: 'legacy-compat',
        title: '多学科旧链路兼容',
        status: 'completed',
        summary: '错题本、复习、PDF、通知和分析文案已补齐语文与英语支持，避免新学科进入后旧链路失真。',
        tasks: [
          'error-book API 已支持五科学科值',
          '错题本和复习页可显示语文、英语',
          'PDF 与通知已同步支持语文、英语',
        ],
      },
      {
        id: 'session-model',
        title: '统一学习会话模型',
        status: 'in_progress',
        summary: '已新增 study_assets / study_asset_messages 作为统一学习记录索引层，先承接新模块记录；error_sessions 等旧表仍继续保留。',
        tasks: [
          '写作、语文分析、英语听力新模块已开始沉淀统一学习记录',
          '旧 essays / error_sessions 已开始通过懒同步并入统一索引层',
          '再逐步提炼模块注册表与统一 StudySession 抽象',
        ],
      },
    ],
  },
];

export function getDevelopmentProgressStats() {
  const items = developmentProgressGroups.flatMap((group) => group.items);
  const completed = items.filter((item) => item.status === 'completed').length;
  const inProgress = items.filter((item) => item.status === 'in_progress').length;
  const pending = items.filter((item) => item.status === 'pending').length;
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    inProgress,
    pending,
    progress,
  };
}
