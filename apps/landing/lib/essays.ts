export type EssaySeries = '道' | '法' | '术' | '器';
export type EssayStatus = 'published' | 'coming_soon';

export type EssaySection = {
  title: string;
  paragraphs: string[];
};

export type Essay = {
  title: string;
  slug: string;
  summary: string;
  series: EssaySeries;
  seriesOrder: number;
  status: EssayStatus;
  publishedAt?: string;
  readingTime: string;
  featured: boolean;
  heroQuote: string;
  keyTakeaways: string[];
  seoTitle: string;
  metaDescription: string;
  body?: EssaySection[];
  nextSlug?: string;
};

export const essays: Essay[] = [
  {
    title: '粗心，是关闭追问的借口',
    slug: 'careless-is-not-the-cause',
    summary:
      '“粗心了”听起来像解释，实际上常常只是一个让问题停止继续被分析的标签。如果根因没有被找到，下一次错误大概率还会再来。',
    series: '道',
    seriesOrder: 1,
    status: 'published',
    publishedAt: '2026-04-01',
    readingTime: '8 分钟',
    featured: true,
    heroQuote: '学习里最贵的成本，不是错误本身，而是停止追问的那一秒。',
    keyTakeaways: [
      '粗心是结论，不是原因。',
      '问题一旦停止追问，就会以别的形式重复出现。',
      '真正有效的学习，必须把一次错误继续追问到根因层。',
    ],
    seoTitle: '孩子总说“粗心”怎么办？粗心背后的真正问题是什么',
    metaDescription:
      '很多孩子做错题时都会说“粗心了”，但粗心往往只是问题被过早关闭的方式。本文从根因分析角度解释为什么“粗心”不是学习问题的答案。',
    body: [
      {
        title: '“粗心了”为什么听起来像答案',
        paragraphs: [
          '孩子做错一道题，最常见的解释往往是“我就是粗心了”。这句话之所以有迷惑性，是因为它看起来像是在承担责任，实际上却没有解释问题为什么发生。',
          '在日常学习里，“粗心”很容易变成一个结束讨论的词。老师不再追问，家长不再追问，孩子自己也不再追问。于是问题被盖上了一个标签，却没有真正被解决。',
        ],
      },
      {
        title: '在工厂里，粗心从来不是根因',
        paragraphs: [
          '在工厂管理里，没有一份合格的质量报告会把根因写成“操作员粗心”。因为这不是原因，只是现象描述。真正的根因，通常还藏在更深的一层甚至几层下面。',
          '同样的逻辑放到学习里也成立。正弦用成余弦，可能不是“粗心”，而是概念没有真正区分；跳步写错，可能不是“粗心”，而是过程没有建立稳定的表达习惯。',
        ],
      },
      {
        title: '为什么过早停止追问代价更大',
        paragraphs: [
          '一次错误本身的代价并不高。高的是这次错误没有留下任何可以继续使用的信息。孩子只是知道“错了”，却不知道自己到底错在知识、方法还是习惯。',
          '一旦问题没有被拆开，下一次它就会重新出现。表面看起来是新的错题，底层其实还是同一个根因在反复发生。',
        ],
      },
      {
        title: '真正有价值的动作，是把错误继续往下问',
        paragraphs: [
          '这也是为什么整套内容会从“错误”开始。因为错误不是终点，它是进入理解的入口。真正重要的不是避免一切错误，而是让每一次错误都成为一次更清楚的追问。',
          '当孩子不再只是说“我粗心了”，而是能说出“我其实没区分这两个概念”“我没有看清题目真正问的是什么”时，学习才开始从现象走向根因。',
        ],
      },
    ],
    nextSlug: 'doing-it-right-once-is-not-mastery',
  },
  {
    title: '做对一次，不等于学会了',
    slug: 'doing-it-right-once-is-not-mastery',
    summary: '原题做对、当下听懂、临时记住，都不等于真正掌握。真正的掌握，必须经得起变式、间隔和迁移。',
    series: '道',
    seriesOrder: 2,
    status: 'coming_soon',
    readingTime: '9 分钟',
    featured: false,
    heroQuote: '“临时会”是学习里最危险的错觉，比“完全不会”更难发现。',
    keyTakeaways: [],
    seoTitle: '做对一次为什么不等于学会？孩子“会了又忘”的真正原因',
    metaDescription: '为什么孩子一讲就懂、一考又错？本文将解释“做对一次不等于学会”的底层逻辑。',
  },
  {
    title: '为什么错题本会变成死书',
    slug: 'why-error-books-die',
    summary: '没有根因分析、没有复习机制、没有状态确认的错题本，只是在存档症状，不是在解决问题。',
    series: '道',
    seriesOrder: 3,
    status: 'coming_soon',
    readingTime: '8 分钟',
    featured: false,
    heroQuote: '没有闭环的错题本，只是一个只进不出的仓库。',
    keyTakeaways: [],
    seoTitle: '为什么大多数错题本没有用？错题本失效的真正原因',
    metaDescription: '很多错题本最后都会变成死书，因为它们只有记录，没有分析、复习和闭环。',
  },
  {
    title: '5 Why 如何用在学习上',
    slug: 'five-why-for-learning',
    summary: '从丰田借来的追问法，不是为了追责，而是为了穿透“粗心”“不会”“忘了”这些表面解释。',
    series: '法',
    seriesOrder: 1,
    status: 'coming_soon',
    readingTime: '10 分钟',
    featured: false,
    heroQuote: '每一个表因背后，往往至少还有三层没有被看见。',
    keyTakeaways: [],
    seoTitle: '5 Why 怎么用在学习上？用追问法找到孩子错误的根因',
    metaDescription: '把 5 Why 从工厂管理迁移到学习场景，帮助家长和孩子把错误从表面追问到根因。',
  },
  {
    title: 'PDCA 学习闭环',
    slug: 'pdca-learning-loop',
    summary: 'Plan、Do、Check、Act 不是企业流程图，而是一条学习中最容易断掉、也最值得重建的节奏。',
    series: '法',
    seriesOrder: 2,
    status: 'coming_soon',
    readingTime: '10 分钟',
    featured: false,
    heroQuote: '很多学习问题不是做得不够多，而是闭环断在了 Check 和 Act。',
    keyTakeaways: [],
    seoTitle: 'PDCA 学习闭环是什么？如何把学习从做题变成闭环',
    metaDescription: '解释 PDCA 如何用于学习闭环，帮助孩子把理解、验证、复习和反馈真正接起来。',
  },
  {
    title: 'Socrates：把闭环电子化的工具',
    slug: 'socrates-digital-learning-loop',
    summary: '工具不是主角，但当错误量、复习节奏和家长协同开始变复杂时，系统就有了存在的必要。',
    series: '器',
    seriesOrder: 3,
    status: 'coming_soon',
    readingTime: '7 分钟',
    featured: false,
    heroQuote: '工具是器，方法是道；工具存在的意义，是降低执行闭环的成本。',
    keyTakeaways: [],
    seoTitle: 'Socrates 是什么？把闭环学习系统数字化的工具说明',
    metaDescription: '介绍 Socrates 如何把闭环学习方法落到工作台、AI 引导、变式验证、复习与报告中。',
  },
];

export const seriesOrder: EssaySeries[] = ['道', '法', '术', '器'];

export function getFeaturedEssay() {
  return essays.find((essay) => essay.featured) ?? essays[0];
}

export function getEssayBySlug(slug: string) {
  return essays.find((essay) => essay.slug === slug);
}

export function getPublishedEssays() {
  return essays.filter((essay) => essay.status === 'published');
}

export function getEssaysBySeries(series: EssaySeries) {
  return essays
    .filter((essay) => essay.series === series)
    .sort((a, b) => a.seriesOrder - b.seriesOrder);
}
