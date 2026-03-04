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

    3. **JSON 输出规范**：
       - 请直接返回纯 JSON 字符串，**不要**使用 markdown 的 \`\`\`json 标记。
       - **闪光点**：严格限制为 3 个。
       - **魔法修改**：严格限制为 4 个。必须包含 original、improved、reason。在 improved 末尾用方括号标注手法。
       - **金句百宝箱**：严格限制为 4 个，每句包含 sentence 和 benefit。
       - **老师总评（overallComment）**：必须包含【温暖抱抱】🌟、【成长小贴士】🚀、【未来寄语】🌈三个部分。
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

// 分析作文
export const analyzeEssay = async (base64Images: string[], grade: GradeLevel): Promise<EssayAnalysis> => {
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

    // 调用 API
    const response = await fetch(API_CONFIG.baseUrl, {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Details:", errorData);
      throw new Error(`API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let contentString = data.choices?.[0]?.message?.content;

    if (!contentString) {
      throw new Error("API 返回内容为空");
    }

    // 清理并解析 JSON
    contentString = contentString.replace(/```json\n?|```/g, "").trim();

    // 尝试解析 JSON，    let result;
    try {
      // 尝试直接解析
      result = JSON.parse(contentString);
    } catch (parseError) {
      // 尝试修复常见的 JSON 问题
      console.warn("First JSON parse failed, attempting to fix...");

      try {
        // 移除可能的尾部逗号
        let fixedContent = contentString.replace(/,(\s*[}\]])/g, '$1');
        // 修复未转义的换行符
        fixedContent = fixedContent.replace(/\n/g, '\\n');
        result = JSON.parse(fixedContent);
      } catch (secondError) {
        console.error("JSON parse failed. Raw content:", contentString.substring(0, 1000));
        throw new Error("AI 返回格式错误，请重试。如果问题持续，请尝试上传更清晰的图片。");
      }
    }

    return {
      ...result,
      transcribedText: (result.title ? result.title + "\n" : "") + result.body
    } as EssayAnalysis;

  } catch (error) {
    console.error("Error analyzing essay:", error);
    throw error;
  }
};
