// =====================================================
// Project Socrates - WeChat Share Utilities
// 微信分享工具函数
// =====================================================

/**
 * 微信 JS-SDK 配置接口
 */
interface WeChatConfig {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

/**
 * 微信分享配置
 */
interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
  success?: () => void;
  cancel?: () => void;
}

/**
 * 检测是否在微信环境中
 */
export function isWeChat(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

/**
 * 获取微信 JS-SDK 签名
 */
export async function getWeChatSignature(url: string): Promise<WeChatConfig | null> {
  try {
    const response = await fetch(`/api/wechat/signature?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.config;
  } catch (error) {
    console.error('[WeChat] Failed to get signature:', error);
    return null;
  }
}

/**
 * 初始化微信 JS-SDK
 */
export async function initWeChatSDK(apis: string[] = ['updateAppMessageShareData', 'updateTimelineShareData']): Promise<boolean> {
  if (typeof window === 'undefined' || !isWeChat()) {
    return false;
  }

  try {
    // 动态加载微信 JS-SDK
    if (!(window as any).wx) {
      await loadScript('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');
    }

    const config = await getWeChatSignature(window.location.href);
    if (!config) {
      console.error('[WeChat] Failed to get config');
      return false;
    }

    return new Promise((resolve) => {
      (window as any).wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: apis
      });

      (window as any).wx.ready(() => {
        console.log('[WeChat] SDK initialized');
        resolve(true);
      });

      (window as any).wx.error((err: any) => {
        console.error('[WeChat] SDK error:', err);
        resolve(false);
      });
    });
  } catch (error) {
    console.error('[WeChat] Init failed:', error);
    return false;
  }
}

/**
 * 设置微信分享（朋友）
 */
export function setWeChatShare(config: ShareConfig): void {
  if (typeof window === 'undefined' || !(window as any).wx) return;

  (window as any).wx.updateAppMessageShareData({
    title: config.title,
    desc: config.desc,
    link: config.link,
    imgUrl: config.imgUrl,
    success: () => {
      console.log('[WeChat] Share to friend success');
      config.success?.();
    },
    cancel: () => {
      console.log('[WeChat] Share to friend cancelled');
      config.cancel?.();
    }
  });
}

/**
 * 设置微信分享（朋友圈）
 */
export function setWeChatTimeline(config: ShareConfig): void {
  if (typeof window === 'undefined' || !(window as any).wx) return;

  (window as any).wx.updateTimelineShareData({
    title: config.title,
    link: config.link,
    imgUrl: config.imgUrl,
    success: () => {
      console.log('[WeChat] Share to timeline success');
      config.success?.();
    },
    cancel: () => {
      console.log('[WeChat] Share to timeline cancelled');
      config.cancel?.();
    }
  });
}

/**
 * 一键设置所有微信分享
 */
export async function setupWeChatShare(config: ShareConfig): Promise<boolean> {
  const initialized = await initWeChatSDK();
  if (!initialized) {
    console.warn('[WeChat] SDK not initialized');
    return false;
  }

  setWeChatShare(config);
  setWeChatTimeline(config);

  return true;
}

/**
 * 动态加载脚本
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * 生成分享链接（带邀请码）
 */
export function generateShareLink(inviteCode: string, baseUrl?: string): string {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${url}/register?ref=${inviteCode}`;
}

/**
 * 默认分享配置
 */
export const DEFAULT_SHARE_CONFIG: ShareConfig = {
  title: 'Socrates 错题本 - 智能学习助手',
  desc: 'AI 驱动的错题管理平台，苏格拉底式引导学习',
  link: typeof window !== 'undefined' ? window.location.origin : '',
  imgUrl: '/images/share-logo.png'
};

/**
 * Hook: useWeChatShare
 * 在组件中使用微信分享
 */
export function useWeChatShare(config?: Partial<ShareConfig>) {
  const shareConfig = {
    ...DEFAULT_SHARE_CONFIG,
    ...config
  };

  const share = async () => {
    if (isWeChat()) {
      await setupWeChatShare(shareConfig);
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareConfig.title,
          text: shareConfig.desc,
          url: shareConfig.link
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return { share, isWeChat: isWeChat() };
}
