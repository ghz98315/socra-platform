import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getEssayAppUrl,
  getModuleStatusLabel,
  getStudyModule,
  getStudySubject,
  type SubjectType,
} from '@/lib/study/catalog';
import { cn } from '@/lib/utils';
import { EssayHistoryBridge } from '@/components/study/EssayHistoryBridge';
import { ChineseAnalysisStudio } from '@/components/study/ChineseAnalysisStudio';
import { EnglishListeningStudio } from '@/components/study/EnglishListeningStudio';
import { WritingStudio } from '@/components/study/WritingStudio';

function getStatusClasses(status: 'live' | 'building' | 'planned') {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'building':
      return 'bg-amber-100 text-amber-700';
    case 'planned':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getPhaseCopy(subject: SubjectType, module: string) {
  if (subject === 'math' && module === 'geometry') {
    return '下一步优先补齐图形修正、手动加点和辅助线，让几何题在识别不准时也能继续完成分析。';
  }

  if (subject === 'chinese' && module === 'composition-review') {
    return '这里会逐步接入原 Essay 的批注工作台、批改历史和作文结果沉淀能力。';
  }

  if (subject === 'chinese' && module === 'composition-idea') {
    return '这里承接作文题目的立意、结构、素材和段落组织建议，先把语文写作思路从录题链路里独立出来。';
  }

  if (subject === 'chinese' && module === 'reading') {
    return '这里开始承接语文阅读理解的专属分析工作流，用文章、题干和学生答案拆出文本依据与答题框架。';
  }

  if (subject === 'chinese' && module === 'foundation') {
    return '这里开始承接字词、病句、修辞、古诗文和文言文等基础知识分析，不再只通过通用录题页进入。';
  }

  if (subject === 'english' && module === 'listening') {
    return '这里先落一个转写稿驱动的英语听力轻量工作台，把场景判断、答案定位、错因分析和复练建议独立出来。';
  }

  if (subject === 'english' && (module === 'writing-review' || module === 'writing-idea')) {
    return '英语写作会拆成“写作思路”和“作文批改”两条路径，避免单页承载过多目标。';
  }

  return '这个模块会和统一学习记录、复习与报告系统对齐，但允许界面和工作流保持学科差异。';
}

function renderModuleWorkspace(subject: SubjectType, module: string) {
  if (subject === 'chinese' && module === 'composition-idea') {
    return <WritingStudio subject="chinese" mode="idea" />;
  }

  if (subject === 'chinese' && module === 'composition-review') {
    return <WritingStudio subject="chinese" mode="review" />;
  }

  if (subject === 'chinese' && module === 'reading') {
    return <ChineseAnalysisStudio mode="reading" />;
  }

  if (subject === 'chinese' && module === 'foundation') {
    return <ChineseAnalysisStudio mode="foundation" />;
  }

  if (subject === 'english' && module === 'writing-idea') {
    return <WritingStudio subject="english" mode="idea" />;
  }

  if (subject === 'english' && module === 'writing-review') {
    return <WritingStudio subject="english" mode="review" />;
  }

  if (subject === 'english' && module === 'listening') {
    return <EnglishListeningStudio />;
  }

  return null;
}

export default async function StudyModulePage({
  params,
}: {
  params: Promise<{ subject: string; module: string }>;
}) {
  const { subject, module } = await params;
  const subjectConfig = getStudySubject(subject);

  if (!subjectConfig || subjectConfig.pro) {
    notFound();
  }

  const moduleConfig = getStudyModule(subjectConfig.id, module);
  if (!moduleConfig) {
    notFound();
  }

  const Icon = moduleConfig.icon;
  const isChineseCompositionReview =
    subjectConfig.id === 'chinese' && moduleConfig.id === 'composition-review';
  const moduleWorkspace = renderModuleWorkspace(subjectConfig.id, moduleConfig.id);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-2xl p-3', subjectConfig.bgColor)}>
              <Icon className={cn('h-5 w-5', subjectConfig.color)} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{moduleConfig.title}</h2>
                <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', getStatusClasses(moduleConfig.status))}>
                  {getModuleStatusLabel(moduleConfig.status)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{moduleConfig.description}</p>
            </div>
          </div>

          {moduleConfig.entryHref ? (
            <Link
              href={moduleConfig.entryHref}
              target={moduleConfig.external ? '_blank' : undefined}
              rel={moduleConfig.external ? 'noreferrer' : undefined}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {moduleConfig.entryLabel ?? '进入当前版本'}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">当前定位</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{getPhaseCopy(subjectConfig.id, moduleConfig.id)}</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">实施原则</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          <li>统一入口，但不强行统一所有结果页。</li>
          <li>统一学习记录，但保留学科和模块差异。</li>
          <li>先做可用版本，再把复习、报告和订阅接入同一底座。</li>
        </ul>
      </section>

      {moduleWorkspace}

      {isChineseCompositionReview ? (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">当前桥接策略</h3>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
              <p>这一阶段不直接粗暴迁移 Essay 全部界面，而是先把作文能力作为语文模块接入，并保持现有工作台可继续使用。</p>
              <p>用户从 Socrates 进入语文作文后，可以直接跳到现有作文工作台；同时 Socrates 开始读取已有作文历史，逐步把结果、报告和学习资产并回主平台。</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={getEssayAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                打开 Essay 作文工作台
              </Link>
              <Link
                href="/study/chinese"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                返回语文学习中心
              </Link>
            </div>
          </section>

          <EssayHistoryBridge />
        </>
      ) : null}
    </div>
  );
}

