import Link from 'next/link';

import { EssayHistoryBridgeV2 } from '@/components/study/EssayHistoryBridgeV2';
import { ChineseAnalysisStudioV2 } from '@/components/study/ChineseAnalysisStudioV2';
import { EnglishListeningStudioV2 } from '@/components/study/EnglishListeningStudioV2';
import { WritingStudioV2 } from '@/components/study/WritingStudioV2';
import { getEssayAppUrl, type StudyModuleId, type SubjectType } from '@/lib/study/catalog';

interface StudyModuleExperience {
  phaseTitle?: string;
  phaseCopy: string;
  principlesTitle?: string;
  principles?: string[];
  renderWorkspace?: () => React.ReactNode;
  renderSupplemental?: () => React.ReactNode;
}

function renderEssayBridgeSupplemental() {
  return (
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

      <EssayHistoryBridgeV2 />
    </>
  );
}

const defaultExperience: StudyModuleExperience = {
  phaseTitle: '当前定位',
  phaseCopy: '这个模块会和统一学习记录、复习与报告系统对齐，但允许界面和工作流保持学科差异。',
  principlesTitle: '实施原则',
  principles: [
    '统一入口，但不强行统一所有结果页。',
    '统一学习记录，但保留学科和模块差异。',
    '先做可用版本，再把复习、报告和订阅接入同一底座。',
  ],
};

const moduleExperiences: Partial<
  Record<SubjectType, Partial<Record<StudyModuleId, StudyModuleExperience>>>
> = {
  math: {
    geometry: {
      phaseCopy: '下一步优先补齐图形修正、手动加点和辅助线，让几何题在识别不准时也能继续完成分析。',
    },
  },
  chinese: {
    reading: {
      phaseCopy: '这里开始承接语文阅读理解的专属分析工作流，用文章、题干和学生答案拆出文本依据与答题框架。',
      renderWorkspace: () => <ChineseAnalysisStudioV2 mode="reading" />,
    },
    foundation: {
      phaseCopy: '这里开始承接字词、病句、修辞、古诗文和文言文等基础知识分析，不再只通过通用录题页进入。',
      renderWorkspace: () => <ChineseAnalysisStudioV2 mode="foundation" />,
    },
    'composition-idea': {
      phaseCopy: '这里承接作文题目的立意、结构、素材和段落组织建议，先把语文写作思路从录题链路里独立出来。',
      renderWorkspace: () => <WritingStudioV2 subject="chinese" mode="idea" />,
    },
    'composition-review': {
      phaseCopy: '这里会逐步接入原 Essay 的批注工作台、批改历史和作文结果沉淀能力。',
      principles: [
        '先保留 Essay 作为深度工作台，不在这一轮强行搬平全部交互。',
        '先把历史、详情、报告和复习链路接回 Socrates 主平台。',
        '等资产结构稳定后，再继续推进作文详情结构化。',
      ],
      renderWorkspace: () => <WritingStudioV2 subject="chinese" mode="review" />,
      renderSupplemental: renderEssayBridgeSupplemental,
    },
  },
  english: {
    listening: {
      phaseCopy: '这里先落一个转写稿驱动的英语听力轻量工作台，把场景判断、答案定位、错因分析和复练建议独立出来。',
      principles: [
        '先把 transcript 驱动的分析闭环做稳，不急着引入音频上传。',
        '先打通详情、报告和复习，不让听力再次沦为孤立入口。',
        '播放器、复听回放和音频链路作为下一阶段单独评估。',
      ],
      renderWorkspace: () => <EnglishListeningStudioV2 />,
    },
    'writing-idea': {
      phaseCopy: '英语写作会拆成“写作思路”和“作文批改”两条路径，避免单页承载过多目标。',
      renderWorkspace: () => <WritingStudioV2 subject="english" mode="idea" />,
    },
    'writing-review': {
      phaseCopy: '英语写作会拆成“写作思路”和“作文批改”两条路径，避免单页承载过多目标。',
      renderWorkspace: () => <WritingStudioV2 subject="english" mode="review" />,
    },
  },
};

export function getStudyModuleExperience(subject: SubjectType, module: StudyModuleId) {
  return {
    ...defaultExperience,
    ...(moduleExperiences[subject]?.[module] || {}),
  };
}
