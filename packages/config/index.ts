// @socra/config - 共享配置

// 品牌配置
export const BRAND_CONFIG = {
  name: 'Socrates',
  slogan: 'AI 引导学习，培养独立思考',
  domain: 'socra.cn',
  logo: '/logo.png',
};

// 产品配置
export const PRODUCTS = {
  socrates: {
    name: '苏格拉底 AI 辅导',
    subdomain: 'socrates',
    url: 'https://socrates.socra.cn',
    description: '上传错题，AI 引导你独立思考',
    status: 'online' as const,
  },
  essay: {
    name: '作文批改',
    subdomain: 'essay',
    url: 'https://essay.socra.cn',
    description: 'AI 智能批改作文',
    status: 'online' as const,
  },
  planner: {
    name: '学习规划',
    subdomain: 'planner',
    url: 'https://planner.socra.cn',
    description: '智能排期，要事优先',
    status: 'online' as const,
  },
};

// 联系方式
export const CONTACT_CONFIG = {
  wechatOfficialAccount: '工程爸的AI教育工厂',
  wechat: 'ghz98315',
  email: 'ghz007@hotmail.com',
};

// AI 模型配置
export const AI_CONFIG = {
  providers: {
    qwen: {
      name: '通义千问',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      envKey: 'DASHSCOPE_API_KEY',
    },
    deepseek: {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      envKey: 'AI_API_KEY_LOGIC',
    },
  },
};
