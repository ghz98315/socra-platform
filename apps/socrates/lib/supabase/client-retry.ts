// =====================================================
// 健壮的 Supabase 客户端实现
// 带有重试逻辑和错误处理
// =====================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 创建客户端
export function createClient() {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey);

  // 包装所有数据库查询，添加重试逻辑
  const originalFrom = client.from.bind(client);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).from = (table: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryBuilder: any = originalFrom(table);

    // 包装查询方法
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    const originalUpdate = queryBuilder.update.bind(queryBuilder);
    const originalUpsert = queryBuilder.upsert.bind(queryBuilder);
    const originalInsert = queryBuilder.insert.bind(queryBuilder);

    // 带重试的 select
    queryBuilder.select = function(...args: any[]) {
      return retryOperation(() => originalSelect(...args));
    };

    // 带重试的 update
    queryBuilder.update = function(...args: any[]) {
      return retryOperation(() => originalUpdate(...args));
    };

    // 带重试的 upsert
    queryBuilder.upsert = function(...args: any[]) {
      return retryOperation(() => originalUpsert(...args));
    };

    // 带重试的 insert
    queryBuilder.insert = function(...args: any[]) {
      return retryOperation(() => originalInsert(...args));
    };

    return queryBuilder;
  };

  return client;
}

// 重试操作函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function retryOperation<T extends (...args: any[]) => any>(
  operation: T
): Promise<ReturnType<T>> {
  let lastError: Error | null = null;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // 检查是否是网络错误
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        console.warn(`Retry ${i + 1}/${MAX_RETRIES} after network error`);
        await delay(RETRY_DELAY * (i + 1)); // 指数退避
        continue;
      }

      // 非网络错误直接抛出
      throw error;
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
