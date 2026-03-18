export interface StudyResultSectionDefinition {
  id: string;
  title: string;
  aliases: string[];
}

export interface StudyResultSection {
  id: string;
  title: string;
  content: string;
}

function isStudyResultSection(value: unknown): value is StudyResultSection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const section = value as Record<string, unknown>;
  return (
    typeof section.id === 'string' &&
    typeof section.title === 'string' &&
    typeof section.content === 'string' &&
    section.id.trim().length > 0 &&
    section.title.trim().length > 0 &&
    section.content.trim().length > 0
  );
}

const moduleSectionDefinitions: Record<string, StudyResultSectionDefinition[]> = {
  reading: [
    { id: 'main-idea', title: '文章主旨', aliases: ['文章主旨', '主旨', '中心主旨'] },
    { id: 'question-breakdown', title: '题干拆解', aliases: ['题干拆解', '题干分析', '拆题'] },
    { id: 'evidence', title: '文本依据', aliases: ['文本依据定位', '文本依据', '依据定位'] },
    { id: 'answer-frame', title: '答题框架', aliases: ['答题框架', '作答框架', '答题结构'] },
    { id: 'risk', title: '失分风险', aliases: ['容易失分点', '失分点', '风险提醒'] },
    { id: 'next-step', title: '下一步', aliases: ['下一步', '下一步先练', '下一步建议'] },
  ],
  foundation: [
    { id: 'point', title: '考查点判断', aliases: ['考查点判断', '考点判断', '识别考点'] },
    { id: 'analysis', title: '逐步分析', aliases: ['逐步分析', '分析过程', '步骤讲解'] },
    { id: 'approach', title: '正确思路', aliases: ['正确思路', '解题思路', '判断思路'] },
    { id: 'mistake', title: '常见误区', aliases: ['常见误区', '错因排查', '容易错的地方'] },
    { id: 'memory', title: '记忆提示', aliases: ['记忆提示', '记忆方法', '口诀'] },
    {
      id: 'next-time',
      title: '下次怎么判断',
      aliases: ['下一次遇到同类题怎么判断', '下次怎么判断', '同类题判断'],
    },
  ],
  'composition-idea': [
    { id: 'review', title: '审题要点', aliases: ['审题要点', '审题', '题目拆解'] },
    { id: 'stance', title: '立意方向', aliases: ['立意方向', '立意', '中心立意'] },
    { id: 'structure', title: '文章结构', aliases: ['文章结构', '结构', '段落结构'] },
    { id: 'materials', title: '可用素材', aliases: ['可用素材', '素材建议', '素材'] },
    { id: 'opening', title: '开头建议', aliases: ['开头建议', '开头', '结尾建议'] },
    { id: 'risk', title: '跑题风险', aliases: ['容易跑题点', '跑题风险', '风险提醒'] },
  ],
  'composition-review': [
    { id: 'overall', title: '整体评价', aliases: ['整体评价', '总评', '整体评估'] },
    { id: 'highlights', title: '亮点', aliases: ['亮点', '优点', '值得保留的部分'] },
    {
      id: 'stance-risk',
      title: '立意与跑题风险',
      aliases: ['立意与跑题风险', '立意风险', '跑题风险'],
    },
    { id: 'structure', title: '结构问题', aliases: ['结构问题', '结构', '段落问题'] },
    {
      id: 'language',
      title: '语言表达问题',
      aliases: ['语言表达问题', '表达问题', '语言问题'],
    },
    { id: 'revision', title: '修改顺序', aliases: ['下一稿修改顺序', '修改顺序', '提分建议'] },
  ],
  'writing-idea': [
    { id: 'genre', title: '文体判断', aliases: ['文体判断', '文体', '任务判断'] },
    { id: 'tense', title: '时态与人称', aliases: ['时态与人称建议', '时态与人称', '时态人称'] },
    { id: 'outline', title: '段落提纲', aliases: ['段落提纲', '提纲', '文章提纲'] },
    { id: 'phrases', title: '高分表达', aliases: ['高分表达', '英文表达', '表达建议'] },
    { id: 'connectors', title: '连接建议', aliases: ['连接词建议', '连接建议', '连接词'] },
    { id: 'next-step', title: '下一步', aliases: ['下一步', '下一步先写', '先写哪一段'] },
  ],
  'writing-review': [
    { id: 'overall', title: '整体评价', aliases: ['整体评价', '总评', '整体评估'] },
    {
      id: 'grammar',
      title: '语法与拼写问题',
      aliases: ['语法与拼写问题', '语法问题', '拼写问题'],
    },
    {
      id: 'expression',
      title: '表达升级建议',
      aliases: ['表达升级建议', '表达建议', '表达升级'],
    },
    {
      id: 'flow',
      title: '结构衔接建议',
      aliases: ['结构衔接建议', '结构衔接', '结构建议'],
    },
    {
      id: 'rewrite',
      title: '高分句 / 改写示例',
      aliases: ['可直接替换的高分句', '高分句', '改写示例'],
    },
    { id: 'checklist', title: '修改清单', aliases: ['下一稿修改清单', '修改清单', '下一稿'] },
  ],
  listening: [
    { id: 'scene', title: '场景与主旨', aliases: ['场景与主旨', '场景', '主旨与场景'] },
    {
      id: 'signals',
      title: '关键词与信号词',
      aliases: ['关键词与信号词', '关键词', '信号词'],
    },
    { id: 'locate', title: '答案定位', aliases: ['答案定位', '定位答案', '依据定位'] },
    { id: 'mistakes', title: '易错点', aliases: ['易错点', '错因分析', '容易错的地方'] },
    { id: 'relisten', title: '复听重点', aliases: ['该再听哪一部分', '复听建议', '复听重点'] },
    {
      id: 'next-time',
      title: '下次怎么更快抓重点',
      aliases: ['下次怎么更快抓重点', '下次怎么抓重点', '提分建议'],
    },
  ],
};

function normalizeHeading(line: string) {
  return line
    .trim()
    .replace(/^[#>*\-\s]+/, '')
    .replace(/^[（(]?[0-9一二三四五六七八九十]+[)）.、:\-]\s*/, '')
    .trim();
}

function extractHeadingMatch(
  line: string,
  definitions: StudyResultSectionDefinition[],
): { definition: StudyResultSectionDefinition; inlineContent: string } | null {
  const normalized = normalizeHeading(line);

  for (const definition of definitions) {
    for (const alias of definition.aliases) {
      if (!normalized.startsWith(alias)) {
        continue;
      }

      const inlineContent = normalized
        .slice(alias.length)
        .replace(/^[:：-]\s*/, '')
        .trim();

      return {
        definition,
        inlineContent,
      };
    }
  }

  return null;
}

function finalizeSection(
  definition: StudyResultSectionDefinition | null,
  lines: string[],
  sections: StudyResultSection[],
) {
  if (!definition) {
    return;
  }

  const content = lines.join('\n').trim();
  if (!content) {
    return;
  }

  sections.push({
    id: definition.id,
    title: definition.title,
    content,
  });
}

export function buildStudyResultSections(module: string, content: string): StudyResultSection[] {
  const definitions = moduleSectionDefinitions[module];
  const normalizedContent = content.trim();

  if (!definitions || !normalizedContent) {
    return [];
  }

  const lines = normalizedContent.split(/\r?\n/);
  const sections: StudyResultSection[] = [];
  let currentDefinition: StudyResultSectionDefinition | null = null;
  let currentLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headingMatch = extractHeadingMatch(line, definitions);

    if (headingMatch) {
      finalizeSection(currentDefinition, currentLines, sections);
      currentDefinition = headingMatch.definition;
      currentLines = headingMatch.inlineContent ? [headingMatch.inlineContent] : [];
      continue;
    }

    if (currentDefinition) {
      currentLines.push(line);
    }
  }

  finalizeSection(currentDefinition, currentLines, sections);

  if (sections.length > 0) {
    return sections;
  }

  const paragraphs = normalizedContent
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, definitions.length);

  return paragraphs.map((paragraph, index) => ({
    id: definitions[index]?.id || `section_${index}`,
    title: definitions[index]?.title || `结果 ${index + 1}`,
    content: paragraph,
  }));
}

export function buildStudyResultSummaryPayload(module: string, content: string) {
  const sections = buildStudyResultSections(module, content);
  return sections.length > 0 ? sections : null;
}

export function readStudyResultSummaryPayload(value: unknown): StudyResultSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isStudyResultSection);
}
