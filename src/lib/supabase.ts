/**
 * Supabase 客户端配置
 * 用于数据库操作（无需认证）
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

// 创建 Supabase 客户端实例
export const supabase = createClient(
  env.supabase.url,
  env.supabase.anonKey
);

// 导出类型化的客户端
export type SupabaseClient = typeof supabase;
