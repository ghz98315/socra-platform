// =====================================================
// Project Socrates - WeChat Signature API
// 微信 JS-SDK 签名 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';

// 微信公众号配置
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';

// 缓存 access_token
let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedJsApiTicket: { ticket: string; expiresAt: number } | null = null;

/**
 * 获取微信 access_token
 */
async function getAccessToken(): Promise<string | null> {
  // 检查缓存
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  try {
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`
    );

    const data = await response.json();

    if (data.access_token) {
      // 缓存 token，提前 5 分钟过期
      cachedAccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000
      };
      return data.access_token;
    }

    console.error('[WeChat] Failed to get access_token:', data);
    return null;
  } catch (error) {
    console.error('[WeChat] Error getting access_token:', error);
    return null;
  }
}

/**
 * 获取微信 jsapi_ticket
 */
async function getJsApiTicket(): Promise<string | null> {
  // 检查缓存
  if (cachedJsApiTicket && cachedJsApiTicket.expiresAt > Date.now()) {
    return cachedJsApiTicket.ticket;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/ticket/getjsapi?access_token=${accessToken}&type=jsapi`
    );

    const data = await response.json();

    if (data.ticket) {
      // 缓存 ticket，提前 5 分钟过期
      cachedJsApiTicket = {
        ticket: data.ticket,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000
      };
      return data.ticket;
    }

    console.error('[WeChat] Failed to get jsapi_ticket:', data);
    return null;
  } catch (error) {
    console.error('[WeChat] Error getting jsapi_ticket:', error);
    return null;
  }
}

/**
 * 生成签名
 */
function generateSignature(ticket: string, nonceStr: string, timestamp: number, url: string): string {
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - 获取微信 JS-SDK 签名
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // 检查微信配置
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      // 开发环境返回模拟数据
      return NextResponse.json({
        config: {
          appId: 'wx_mock_app_id',
          timestamp: Math.floor(Date.now() / 1000),
          nonceStr: generateNonceStr(),
          signature: 'mock_signature_for_development'
        },
        debug: true,
        message: 'WeChat credentials not configured, using mock data'
      });
    }

    const ticket = await getJsApiTicket();
    if (!ticket) {
      return NextResponse.json(
        { error: 'Failed to get jsapi_ticket' },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = generateNonceStr();
    const signature = generateSignature(ticket, nonceStr, timestamp, url);

    return NextResponse.json({
      config: {
        appId: WECHAT_APP_ID,
        timestamp,
        nonceStr,
        signature
      }
    });
  } catch (error: any) {
    console.error('[WeChat Signature API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
