import {
  BookOpen,
  Camera,
  FileText,
  FlaskConical,
  Headphones,
  PencilLine,
  Shapes,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type SubjectType = 'math' | 'chinese' | 'english' | 'physics' | 'chemistry';

export interface SubjectConfig {
  id: SubjectType;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  pro?: boolean;
}

export type StudyModuleStatus = 'live' | 'building' | 'planned';

export type StudyModuleId =
  | 'problem'
  | 'geometry'
  | 'reading'
  | 'foundation'
  | 'composition-review'
  | 'composition-idea'
  | 'listening'
  | 'writing-review'
  | 'writing-idea';

export interface StudyModuleDefinition {
  id: StudyModuleId;
  title: string;
  shortTitle: string;
  description: string;
  status: StudyModuleStatus;
  icon: LucideIcon;
  entryHref?: string;
  entryLabel?: string;
  external?: boolean;
}

export interface StudySubjectDefinition extends SubjectConfig {
  overview: string;
  modules: StudyModuleDefinition[];
}

export const subjectConfigs: Record<SubjectType, SubjectConfig> = {
  math: {
    id: 'math',
    name: '数学',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '录题分析与几何复盘',
  },
  chinese: {
    id: 'chinese',
    name: '语文',
    icon: BookOpen,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: '录题分析、阅读与作文',
  },
  english: {
    id: 'english',
    name: '英语',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: '录题分析、听力与写作',
  },
  physics: {
    id: 'physics',
    name: '物理',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: '后续扩展学科',
    pro: true,
  },
  chemistry: {
    id: 'chemistry',
    name: '化学',
    icon: FlaskConical,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '后续扩展学科',
    pro: true,
  },
};

export const studySubjectCatalog: Record<SubjectType, StudySubjectDefinition> = {
  math: {
    ...subjectConfigs.math,
    overview: '数学当前以录题分析为主链路，后续重点补齐几何修正、辅助线和变式练习。',
    modules: [
      {
        id: 'problem',
        title: '录题分析',
        shortTitle: '录题分析',
        description: '拍题、OCR、解题分析、错题沉淀的统一入口。',
        status: 'live',
        icon: Camera,
        entryHref: '/study/math/problem',
        entryLabel: '进入当前数学录题分析',
      },
      {
        id: 'geometry',
        title: '几何修正',
        shortTitle: '几何修正',
        description: '补点、加辅助线、图形校正与几何专用分析能力。',
        status: 'building',
        icon: Shapes,
        entryHref: '/workbench?subject=math',
        entryLabel: '先用当前数学录题分析',
      },
    ],
  },
  chinese: {
    ...subjectConfigs.chinese,
    overview: '语文会从单一录题入口扩展为阅读、基础知识、作文批改和写作思路的组合型能力中心。',
    modules: [
      {
        id: 'problem',
        title: '录题分析',
        shortTitle: '录题分析',
        description: '与数学统一入口，但使用语文学科分析策略。',
        status: 'live',
        icon: Camera,
        entryHref: '/study/chinese/problem',
        entryLabel: '进入当前语文录题分析',
      },
      {
        id: 'reading',
        title: '阅读理解',
        shortTitle: '阅读理解',
        description: '阅读题结构化拆解、答题思路与参考作答结构。',
        status: 'live',
        icon: BookOpen,
      },
      {
        id: 'foundation',
        title: '基础知识',
        shortTitle: '基础知识',
        description: '字词、病句、修辞、古诗文和文言基础分析。',
        status: 'live',
        icon: FileText,
      },
      {
        id: 'composition-review',
        title: '作文批改',
        shortTitle: '作文批改',
        description: '把原 Essay 的批注与审阅能力并入语文模块。',
        status: 'building',
        icon: PencilLine,
        entryHref: getEssayAppUrl(),
        entryLabel: '进入作文工作台',
        external: true,
      },
      {
        id: 'composition-idea',
        title: '写作思路',
        shortTitle: '写作思路',
        description: '围绕题目生成立意、结构和素材使用建议。',
        status: 'building',
        icon: FileText,
      },
    ],
  },
  english: {
    ...subjectConfigs.english,
    overview: '英语将拆成录题分析、听力和写作三条主能力，不再只作为拍题附属学科。',
    modules: [
      {
        id: 'problem',
        title: '录题分析',
        shortTitle: '录题分析',
        description: '阅读、语法、选择和改错题的统一分析入口。',
        status: 'live',
        icon: Camera,
        entryHref: '/study/english/problem',
        entryLabel: '进入当前英语录题分析',
      },
      {
        id: 'listening',
        title: '听力',
        shortTitle: '听力',
        description: '音频输入、听力理解、错因定位和复练能力。',
        status: 'live',
        icon: Headphones,
      },
      {
        id: 'writing-review',
        title: '作文批改',
        shortTitle: '作文批改',
        description: '英语作文语法、表达和结构批改。',
        status: 'building',
        icon: PencilLine,
      },
      {
        id: 'writing-idea',
        title: '写作思路',
        shortTitle: '写作思路',
        description: '写作提纲、句型建议和段落组织能力。',
        status: 'building',
        icon: FileText,
      },
    ],
  },
  physics: {
    ...subjectConfigs.physics,
    overview: '物理作为后续扩展学科预留，当前不进入主导航。',
    modules: [],
  },
  chemistry: {
    ...subjectConfigs.chemistry,
    overview: '化学作为后续扩展学科预留，当前不进入主导航。',
    modules: [],
  },
};

export function getSupportedSubjects(): SubjectConfig[] {
  return Object.values(subjectConfigs).filter((subject) => !subject.pro);
}

export function getAllSubjects(): SubjectConfig[] {
  return Object.values(subjectConfigs);
}

export function getSubjectConfig(id: string): SubjectConfig | undefined {
  return subjectConfigs[id as SubjectType];
}

export function getStudySubjects(options?: { includePro?: boolean }): StudySubjectDefinition[] {
  const includePro = options?.includePro ?? false;
  return Object.values(studySubjectCatalog).filter((subject) => includePro || !subject.pro);
}

export function getStudySubject(subject: string): StudySubjectDefinition | undefined {
  return studySubjectCatalog[subject as SubjectType];
}

export function getStudySubjectOverview(subject: SubjectType): string | undefined {
  return studySubjectCatalog[subject]?.overview;
}

export function getStudySubjectModules(subject: SubjectType): StudyModuleDefinition[] {
  return studySubjectCatalog[subject]?.modules ?? [];
}

export function getStudyModule(subject: SubjectType, module: string): StudyModuleDefinition | undefined {
  return studySubjectCatalog[subject]?.modules.find((item) => item.id === module);
}

export function buildStudySubjectHref(subject: SubjectType): string {
  return `/study/${subject}`;
}

export function buildStudyModuleHref(subject: SubjectType, module: StudyModuleId): string {
  return `/study/${subject}/${module}`;
}

export function getDefaultStudyModule(subject: SubjectType): StudyModuleDefinition | undefined {
  return studySubjectCatalog[subject]?.modules[0];
}

export function getModuleStatusLabel(status: StudyModuleStatus): string {
  switch (status) {
    case 'live':
      return '可用';
    case 'building':
      return '建设中';
    case 'planned':
      return '规划中';
    default:
      return '规划中';
  }
}

export function getEssayAppUrl(): string {
  return process.env.NEXT_PUBLIC_ESSAY_APP_URL || 'https://essay.socra.cn';
}
