import { useState, useEffect } from 'react';

export interface Article {
  id: number | string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  slug: string;
  content: string;
  format?: 'markdown' | 'html';
}

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 1,
    title: '粗心，是关闭追问的借口',
    excerpt: '孩子每次考试"粗心"，讲了还是错？问题不在孩子，在你的分析方式。一个在比亚迪做了10年质量管理的工程师爸爸，把工厂的8D根因分析法搬进了儿子的错题本——5步闭环，从现象描述到效果验证，彻底戒掉"下次注意"。方法文末免费领，系统正在用自家孩子压力测试中。',
    date: '2026-04-01',
    category: '方法论',
    slug: 'quality-analysis-for-mistakes',
    format: 'markdown',
    content: `孩子每次考试"粗心"，讲了还是错？问题不在孩子，在你的分析方式。一个在比亚迪做了10年质量管理的工程师爸爸，把工厂的8D根因分析法搬进了儿子的错题本——5步闭环，从现象描述到效果验证，彻底戒掉"下次注意"。

## 为什么“粗心”是一个伪命题？

在工厂里，如果一个操作员把零件装反了，质量工程师绝对不会在报告上写“操作员粗心”。因为“粗心”是一个无法被衡量、无法被改进的词。我们会问：是防呆设计没做好？是作业指导书不清晰？还是光线太暗导致视觉疲劳？

同理，当孩子把正弦算成余弦时，这绝不是一句“下次注意”就能解决的。这背后隐藏着一个没有被找到的根因，和一个准备再次发生的错误。

## 降维打击：把 8D 报告变成 5 步错题闭环

我把汽车行业的 8D（Eight Disciplines）问题解决法进行了简化，提取出适合孩子日常学习的 5 步闭环：

1. **现象描述 (D2)：** 错在哪里？（客观记录，不带情绪）
2. **临时对策 (D3)：** 这道题的正确解法是什么？（订正）
3. **根因分析 (D4)：** 为什么会错？（连问5个为什么，直到找到知识盲区或习惯漏洞）
4. **永久对策 (D5/D6)：** 怎么确保下次不错？（总结规律、提炼口诀、加入Socrates标签网络）
5. **效果验证 (D8)：** 找三道同类题进行压力测试。（闭环的最后一步）
`
  },
  {
    id: 2,
    title: '做对一次，不等于学会了',
    excerpt: '为什么很多孩子平时作业全对，一到考试就错？因为"做对一次"只是偶然，"连续做对三次"才是必然。本文探讨如何通过压力测试和间隔重复，把短时记忆转化为长期肌肉记忆。',
    date: '即将发布',
    category: '方法论',
    slug: '#',
    content: ''
  },
  {
    id: 3,
    title: '为什么大多数错题本都是死书',
    excerpt: '抄题半小时，看题一分钟。如果错题本不能被高频检索、不能形成知识网络，那它只是一本安慰剂。',
    date: '即将发布',
    category: '方法论',
    slug: '#',
    content: ''
  },
  {
    id: 4,
    title: '5 Why 如何用在学习上',
    excerpt: '丰田的 5 Why 分析法，不仅能解决生产线上的问题，更能帮你挖出孩子知识体系里的根本漏洞。',
    date: '即将发布',
    category: '方法论',
    slug: '#',
    content: ''
  },
  {
    id: 5,
    title: 'PDCA 学习闭环',
    excerpt: '计划 (Plan)、执行 (Do)、检查 (Check)、行动 (Act)。把工厂的持续改进模型，变成孩子的提分利器。',
    date: '即将发布',
    category: '方法论',
    slug: '#',
    content: ''
  },
  {
    id: 6,
    title: 'Socrates：把闭环电子化的工具',
    excerpt: '心法需要兵器来落地。Socrates 是如何把上述所有方法论，变成一个每天只需要 15 分钟的自动化系统的？',
    date: '即将发布',
    category: '产品动态',
    slug: '#',
    content: ''
  }
];

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('socrates_articles');
    if (stored) {
      setArticles(JSON.parse(stored));
    } else {
      setArticles(DEFAULT_ARTICLES);
      localStorage.setItem('socrates_articles', JSON.stringify(DEFAULT_ARTICLES));
    }
    setIsLoaded(true);
  }, []);

  const addArticle = (article: Omit<Article, 'id' | 'date'>) => {
    const newArticle = { 
      ...article, 
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newArticle, ...articles];
    setArticles(updated);
    localStorage.setItem('socrates_articles', JSON.stringify(updated));
  };

  const deleteArticle = (id: number | string) => {
    const updated = articles.filter(a => a.id !== id);
    setArticles(updated);
    localStorage.setItem('socrates_articles', JSON.stringify(updated));
  };

  return { articles, addArticle, deleteArticle, isLoaded };
}
