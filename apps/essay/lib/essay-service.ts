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

    3. **JSON 输出格式（必须严格遵守）**：
       请直接返回以下 JSON 格式，**不要**使用 markdown 的 \`\`\`json 标记：

       {
         "title": "识别到的作文标题",
         "body": "识别到的作文正文内容",
         "highlights": ["闪光点1", "闪光点2", "闪光点3"],
         "corrections": [
           {"original": "原句", "improved": "修改后的句子", "reason": "修改原因"}
         ],
         "goldenSentences": [
           {"sentence": "金句内容", "benefit": "赏析说明"}
         ],
         "overallComment": "【温暖抱抱】🌟...\\n\\n【成长小贴士】🚀...\\n\\n【未来寄语】🌈..."
       }

       - **title**: 识别图片中的作文标题，如果没有明显标题则填"无题"
       - **body**: 识别到的完整作文正文
       - **highlights**: 3个闪光点
       - **corrections**: 4个魔法修改，必须包含 original、improved、reason
       - **goldenSentences**: 4个金句，每句包含 sentence 和 benefit
       - **overallComment**: 老师总评，必须包含【温暖抱抱】🌟、【成长小贴士】🚀、【未来寄语】🌈三个部分
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

      ${commonInstructions}
    `;
  }

  // 小学高年级 (4-6年级)
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
    contentString = contentString.replace(/```json\n?|```/g, "").trim();
    console.log("🧹 Cleaned content preview:", contentString.substring(0, 300));

    // 尝试解析 JSON
    let result;
    try {
      // 尝试直接解析
      result = JSON.parse(contentString);
      console.log("✅ JSON 解析成功");
    } catch (parseError) {
      // 尝试修复常见的 JSON 问题
      console.warn("⚠️ First JSON parse failed, attempting to fix...");
      console.warn("Parse error:", parseError);

      try {
        // 移除可能的尾部逗号
        let fixedContent = contentString.replace(/,(\s*[}\]])/g, '$1');
        // 修复未转义的换行符
        fixedContent = fixedContent.replace(/\n/g, '\\n');
        result = JSON.parse(fixedContent);
        console.log("✅ JSON 修复后解析成功");
      } catch (secondError) {
        console.error("❌ JSON parse failed completely");
        console.error("Raw content (first 1000 chars):", contentString.substring(0, 1000));
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
