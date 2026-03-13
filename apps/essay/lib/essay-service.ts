// =====================================================
// Essay Service - AI 批改服务
// =====================================================

import { EssayAnalysis, GradeLevel } from "../types";
import { getCurrentUser } from "./supabase";

// API 配置
const API_CONFIG = {
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  model: "qwen-vl-max"
};

// 获取 API Key（从环境变量或用户设置）
const getApiKey = async (): Promise<string> => {
  // 优先从用户设置获取
  const storedKey = localStorage.getItem('ai_essay_api_key');
  if (storedKey && storedKey !== 'PLACEHOLDER_API_KEY') {
    return storedKey;
  }

  // TODO: 从后端 API 获取（用户订阅后）
  // const user = await getCurrentUser();
  // if (user) {
  //   const response = await fetch('/api/essay/api-key');
  //   const { apiKey } = await response.json();
  //   return apiKey;
  // }

  // 尝试环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DASHSCOPE_API_KEY) {
    return import.meta.env.VITE_DASHSCOPE_API_KEY;
  }

  return '';
};

// 设置 API Key
export const setApiKey = (key: string) => {
  localStorage.setItem('ai_essay_api_key', key);
};

// 检查 API Key 是否已配置
export const hasApiKey = async (): Promise<boolean> => {
  const key = await getApiKey();
  return key !== '' && key !== 'PLACEHOLDER_API_KEY';
};

// 压缩图片
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const MAX_SIZE = 1024;
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round(height * MAX_SIZE / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round(width * MAX_SIZE / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64Str;
  });
};

// 获取年级对应的系统提示词
const getSystemPrompt = (grade: GradeLevel): string => {
  const isLowerPrimary = ['小学一年级', '小学二年级', '小学三年级'].includes(grade);
  const isMiddleSchool = ['初中一年级', '初中二年级', '初中三年级'].includes(grade);

  const commonInstructions = `
    **通用执行规则（必须严格遵守）：**

    1. **多页内容拼接**：
       - 识别所有图片内容，必须根据上下文语义将内容拼接成一篇完整的文章。
       - **严禁**在跨页处出现不自然的断句。

    2. **段落排版处理（非常重要 - 必须严格遵守）**：
       - **识别"物理换行"**：如果一行文字写到了纸张边缘自动换行，且下一行**没有缩进**，这属于同一个自然段。请将它们**无缝拼接**在一起，**不要**添加任何标点符号，也**不要**换行。
       - **识别"自然段"**：只有当看到明显的**段落缩进**（通常首行空两格）或者**空行**时，才表示这是一个新的自然段。
       - **段落间距（关键）**：每个自然段之间**必须且只能有一个空行**（即用两个换行符 \\n\\n 分隔）。

    3. **输出契约（必须严格遵守）**：
       - 你**只能**输出一个 JSON 对象，开头必须是 {，结尾必须是 }。
       - **禁止**输出 Markdown、解释文字、代码块、额外字段、或任何非 JSON 内容。
       - JSON 中字符串字段**禁止出现真实换行符**；只能使用转义字符 \\n 表示换行（段落分隔用 \\n\\n）。

    4. **JSON 格式（必须严格遵守，字段齐全且长度固定）**：
       请直接返回以下 JSON 格式（不要使用 \`\`\`json 包裹）：

       {
         "title": "识别到的作文标题（无标题则填无题）",
         "body": "识别到的作文正文（自然段用 \\n\\n 分隔）",
         "rating": {
           "stage": "primary|middle",
           "score": 0,
           "level": "primary: A+|A|B+|B；middle: A|B|C|D",
           "oneLineSummary": "一句话等级解释，给孩子看的",
           "breakdown": [
             {"name": "维度名", "score": 0, "max": 0, "comment": "一句话"}
           ]
         },
         "highlights": ["闪光点1", "闪光点2", "闪光点3"],
         "corrections": [
           {"original": "原句（必须来自body且为完整一句话）", "improved": "修改后的句子", "reason": "修改原因（1句）"}
         ],
         "goldenSentences": [
           {"sentence": "金句（必须来自body且为完整一句话）", "benefit": "赏析说明（1-2句）"}
         ],
         "overallComment": "【温暖抱抱】🌟：...\\n\\n【成长小贴士】🚀：...\\n\\n【未来寄语】🌈：..."
       }

    5. **强约束（非常重要）**：
       - corrections 必须**正好4条**，goldenSentences 必须**正好4条**，highlights 必须**正好3条**。
       - corrections[*].original 必须逐字出自 body，且必须是一整句（以。！？结尾）。不得编造原句。
       - goldenSentences[*].sentence 必须逐字出自 body，且必须是一整句（以。！？结尾）。不得编造金句。
       - original / sentence 之间不得重复。

    6. **老师总评 overallComment（严格格式）**：
       - 必须正好 3 段，且顺序固定：温暖抱抱 -> 成长小贴士 -> 未来寄语。
       - 段与段之间必须使用 \\n\\n 分隔。
       - 每段必须以固定前缀开头，且使用全角冒号：
         1) 【温暖抱抱】🌟：
         2) 【成长小贴士】🚀：
         3) 【未来寄语】🌈：
       - 禁止出现第4个【...】小标题。

    7. **等级评定 rating（按年级套用标准，满分100）**：
       - 你必须输出 score（0-100）与 breakdown（各维度打分与一句话评语）。
       - stage 必须与年级一致：小学用 primary，初中用 middle。
       - breakdown 必须包含规定的维度与 max（不要自创维度）：小学与初中维度不同（见分龄要求）。
       - 你必须输出 level：
         - primary（小学）：A+（90-100），A（80-89），B+（70-79），B（0-69）
         - middle（初中）：A（88-100），B（70-87），C（55-69），D（0-54）
  `;

  if (isLowerPrimary) {
    return `
      你是一位温柔耐心、充满童趣的**小学低年级启蒙老师**。
      请根据学生年级【${grade}】，为这份手写作文提供批改。

      **核心人设**：
      - 说话像幼儿园老师一样温柔，多用叠词和语气词。
      - 善用 Emoji 来增加趣味性。
      - **绝对不直接批评**！把错别字说成是"调皮的小虫子"。

      **批改侧重**：
      1. **基础规范**：句子是否完整、标点符号是否正确。
      2. **词汇扩充**：引导孩子使用简单的形容词。
      3. **魔法修改策略**：把"干巴巴"的短句变成"胖乎乎"的长句。

      **总评风格（小学 - 情绪价值优先）**：
      - 温暖抱抱部分要更充分、更具体，优点必须落到作文细节。
      - 成长小贴士给2条可操作建议，每条附一个小练习。
      - 未来寄语给1个下次写作目标 + 1个5分钟练习。

      **等级评定（小学 - 100分制）**：
      - rating.stage 必须是 primary
      - rating.breakdown 维度与满分必须是：
        1) 基础规范（max=30）
        2) 内容与描写（max=30）
        3) 结构与条理（max=20）
        4) 语言表达（max=20）
      - rating.score 为四项之和（0-100）
      - rating.level 只允许 A+ / A / B+ / B

      ${commonInstructions}
    `;
  }

  if (isMiddleSchool) {
    return `
      你是一位博学儒雅、深谙青少年心理的**初中文学导师**。
      请根据学生年级【${grade}】，为这份手写作文提供批改。

      **核心人设**：
      - 语气知性、专业、尊重。
      - 拒绝低幼化的夸奖，提供有深度的见解。
      - 引导学生关注社会、人生或情感的深层逻辑。

      **批改侧重**：
      1. **立意与深度**：中心思想是否突出？是否有独特见解？
      2. **逻辑与结构**：段落过渡是否自然？论述是否严密？
      3. **魔法修改策略**：提升文学性，炼字炼句。

      **总评风格（初中 - 可操作建议优先）**：
      - 语气专业、具体，避免低幼化夸奖。
      - 成长小贴士给2-3条建议，每条必须写出可执行步骤（怎么做）。
      - 除 overallComment 固定 emoji 外，尽量少用 emoji。

      **等级评定（初中 - 100分制）**：
      - rating.stage 必须是 middle
      - rating.breakdown 维度与满分必须是：
        1) 立意与思辨（max=30）
        2) 结构与逻辑（max=30）
        3) 语言与表达（max=25）
        4) 细节与材料（max=15）
      - rating.score 为四项之和（0-100）
      - rating.level 只允许 A / B / C / D

      ${commonInstructions}
    `;
  }

  // 小学高年级 (4-6年级) - 情绪价值优先，但建议要更具体
  return `
    你是一位拥有20年一线教学经验的**资深小学语文教师**，也是一位幽默风趣的"夸夸团"团长。
    请根据学生年级【${grade}】，为这份手写作文提供批改。

    **核心人设**：
    - 亲切、幽默、亦师亦友。
    - 坚持**三明治沟通法**（先夸 -> 再提建议 -> 最后鼓励）。
    - 严厉打击"流水账"，但用词要委婉有趣。

    **批改侧重**：
    1. **描写手法**：是否运用了五感和修辞。
    2. **结构布局**：段落是否清晰，开头结尾是否呼应。
    3. **魔法修改策略**：消灭流水账，让句子有画面感。

    **总评风格（小学 - 情绪价值优先）**：
    - 先夸具体优点，再给2条可执行建议，最后鼓励。
    - 成长小贴士每条建议要给一个“怎么改/怎么练”的小步骤。

    **等级评定（小学 - 100分制）**：
    - rating.stage 必须是 primary
    - rating.breakdown 维度与满分必须是：
      1) 基础规范（max=30）
      2) 内容与描写（max=30）
      3) 结构与条理（max=20）
      4) 语言表达（max=20）
    - rating.score 为四项之和（0-100）
    - rating.level 只允许 A+ / A / B+ / B

    ${commonInstructions}
  `;
};

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
};

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的 API 调用
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // 如果是速率限制错误，等待后重试
      if (response.status === 429 && attempt < retries) {
        const waitTime = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        console.log(`⏳ 速率限制，等待 ${waitTime}ms 后重试 (${attempt + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }

      // 如果是服务器错误，等待后重试
      if (response.status >= 500 && attempt < retries) {
        const waitTime = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        console.log(`⏳ 服务器错误，等待 ${waitTime}ms 后重试 (${attempt + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const waitTime = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        console.log(`⏳ 网络错误，等待 ${waitTime}ms 后重试 (${attempt + 1}/${retries})`);
        await delay(waitTime);
      }
    }
  }

  throw lastError || new Error("API 请求失败，请检查网络连接后重试");
};

function stripCodeFences(input: string): string {
  return input.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
}

function extractJsonObject(input: string): string {
  const first = input.indexOf('{');
  const last = input.lastIndexOf('}');
  if (first >= 0 && last > first) return input.slice(first, last + 1);
  return input.trim();
}

function removeTrailingCommas(input: string): string {
  return input.replace(/,\s*([}\]])/g, '$1');
}

// Escape raw control characters that sometimes appear inside JSON strings from LLM output.
function escapeControlCharsInsideJsonStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaping = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    // inString === true
    if (escaping) {
      escaping = false;
      out += ch;
      continue;
    }

    if (ch === '\\') {
      escaping = true;
      out += ch;
      continue;
    }

    if (ch === '\n') {
      out += '\\n';
      continue;
    }
    if (ch === '\r') {
      out += '\\r';
      continue;
    }
    if (ch === '\t') {
      out += '\\t';
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getDefaultRatingBreakdown(stage: 'primary' | 'middle') {
  if (stage === 'middle') {
    return [
      { name: '立意与思辨', score: 0, max: 30, comment: '' },
      { name: '结构与逻辑', score: 0, max: 30, comment: '' },
      { name: '语言与表达', score: 0, max: 25, comment: '' },
      { name: '细节与材料', score: 0, max: 15, comment: '' },
    ];
  }

  return [
    { name: '基础规范', score: 0, max: 30, comment: '' },
    { name: '内容与描写', score: 0, max: 30, comment: '' },
    { name: '结构与条理', score: 0, max: 20, comment: '' },
    { name: '语言表达', score: 0, max: 20, comment: '' },
  ];
}

function deriveLevelFromScore(stage: 'primary' | 'middle', score: number): string {
  if (stage === 'primary') {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    return 'B';
  }

  if (score >= 88) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function normalizeRating(grade: GradeLevel, rating: any) {
  const stage: 'primary' | 'middle' = grade.startsWith('初中') ? 'middle' : 'primary';
  const allowed = stage === 'primary' ? new Set(['A+', 'A', 'B+', 'B']) : new Set(['A', 'B', 'C', 'D']);

  const breakdownRaw = Array.isArray(rating?.breakdown) ? rating.breakdown : [];
  const defaults = getDefaultRatingBreakdown(stage);

  // Normalize to a stable, stage-specific schema:
  // - fixed dimension names + max points
  // - score clamped to each dimension max
  // - ignore unknown dimensions to keep UI/PDF predictable
  const breakdown = defaults.map((dim) => {
    const raw = breakdownRaw.find((x: any) => typeof x?.name === 'string' && x.name.trim() === dim.name);
    const max = dim.max;
    const score = clampNumber(raw?.score, 0, max, 0);
    const comment = typeof raw?.comment === 'string' ? raw.comment : '';
    return { name: dim.name, score, max, comment };
  });

  const scoreFromBreakdown = breakdown.reduce((sum: number, item: any) => sum + (Number(item?.score) || 0), 0);
  const score = clampNumber(scoreFromBreakdown, 0, 100, 0);

  const levelRaw = typeof rating?.level === 'string' ? rating.level.trim() : '';
  const level = allowed.has(levelRaw) ? levelRaw : deriveLevelFromScore(stage, score);

  const oneLineSummary =
    typeof rating?.oneLineSummary === 'string' && rating.oneLineSummary.trim()
      ? rating.oneLineSummary.trim()
      : stage === 'primary'
        ? `本次评分：${score}分（${level}），继续保持好习惯，慢慢进步就很棒。`
        : `本次评分：${score}分（${level}），建议按要点逐条提升结构与表达。`;

  return {
    stage,
    score,
    level,
    oneLineSummary,
    breakdown,
  };
}

// 分析作文
export const analyzeEssay = async (
  base64Images: string[],
  grade: GradeLevel,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<EssayAnalysis> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error("请先配置 API KEY");
    }

    // 压缩图片
    const compressedImages = await Promise.all(base64Images.map(compressImage));

    // 准备消息内容
    const userContent: any[] = [
      { type: "text", text: "请帮我批改这篇手写作文，严格按照系统指令的 JSON 格式输出。" }
    ];

    compressedImages.forEach(imgDataUrl => {
      userContent.push({
        type: "image_url",
        image_url: { url: imgDataUrl }
      });
    });

    const messages = [
      { role: "system", content: getSystemPrompt(grade) },
      { role: "user", content: userContent }
    ];

    // 调用 API（带重试）
    const response = await fetchWithRetry(
      API_CONFIG.baseUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: API_CONFIG.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4000,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Details:", errorData);

      // 更友好的错误信息
      if (response.status === 401) {
        throw new Error("API Key 无效，请检查配置");
      } else if (response.status === 402) {
        throw new Error("API 额度不足，请充值后重试");
      } else if (response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试");
      }

      throw new Error(`API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("📡 API Response Status:", response.status);
    console.log("📡 API Response Data:", JSON.stringify(data, null, 2).substring(0, 500));

    let contentString = data.choices?.[0]?.message?.content;

    if (!contentString) {
      console.error("❌ API 返回内容为空. Full response:", data);
      throw new Error("API 返回内容为空，请检查图片是否清晰或重试");
    }

    console.log("📝 Raw content length:", contentString.length);
    console.log("📝 Raw content preview:", contentString.substring(0, 300));

    // 清理并解析 JSON
    const cleaned = stripCodeFences(contentString);
    const candidate = extractJsonObject(cleaned);
    console.log("🧹 Cleaned content preview:", candidate.substring(0, 300));

    let result: any;
    try {
      result = JSON.parse(candidate);
      console.log("✅ JSON 解析成功");
    } catch (parseError) {
      console.warn("⚠️ First JSON parse failed, attempting to fix...");
      console.warn("Parse error:", parseError);

      try {
        let fixed = removeTrailingCommas(candidate);
        fixed = escapeControlCharsInsideJsonStrings(fixed);
        result = JSON.parse(fixed);
        console.log("✅ JSON 修复后解析成功");
      } catch (secondError) {
        console.error("❌ JSON parse failed completely");
        console.error("Raw content (first 1000 chars):", candidate.substring(0, 1000));
        throw new Error("AI 返回格式错误，请重试。如果问题持续，请尝试上传更清晰的图片。");
      }
    }

    // 验证必要字段
    console.log("🔍 Parsed result keys:", Object.keys(result || {}));
    console.log("🔍 Title:", result?.title);
    console.log("🔍 Body length:", result?.body?.length || 0);
    console.log("🔍 Highlights count:", result?.highlights?.length || 0);
    console.log("🔍 Corrections count:", result?.corrections?.length || 0);

    if (!result.body && !result.title) {
      console.error("❌ 解析结果缺少正文内容");
      throw new Error("无法识别作文内容，请确保图片清晰且包含手写文字");
    }

    // 确保返回完整对象，添加默认值
    const finalResult: EssayAnalysis = {
      title: result.title || "",
      body: result.body || "",
      transcribedText: (result.title ? result.title + "\n" : "") + (result.body || ""),
      rating: normalizeRating(grade, result.rating),
      highlights: result.highlights || [],
      corrections: result.corrections || [],
      goldenSentences: result.goldenSentences || [],
      overallComment: result.overallComment || "暂无总评"
    };

    console.log("🎉 分析完成，返回结果");
    return finalResult;

  } catch (error) {
    console.error("Error analyzing essay:", error);
    throw error;
  }
};
