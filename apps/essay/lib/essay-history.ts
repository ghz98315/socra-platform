// =====================================================
// Essay History Service - 作文历史记录服务
// =====================================================

import { supabase } from './supabase';
import { EssayAnalysis, GradeLevel } from '../types';

// 数据库中的作文记录类型
export interface EssayRecord {
  id: string;
  user_id: string;
  profile_id: string | null;
  title: string | null;
  content: string;
  grade: GradeLevel;
  images: string[];
  analysis: EssayAnalysis;
  created_at: string;
  updated_at: string;
}

// 保存作文记录
export async function saveEssay(params: {
  title: string | null;
  content: string;
  grade: GradeLevel;
  images: string[];
  analysis: EssayAnalysis;
}): Promise<EssayRecord | null> {
  try {
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('User not authenticated, skipping save');
      return null;
    }

    const { data, error } = await supabase
      .from('essays')
      .insert({
        user_id: user.id,
        profile_id: null, // TODO: 关联当前选中的 profile
        title: params.title,
        content: params.content,
        grade: params.grade,
        images: params.images,
        analysis: params.analysis,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving essay:', error);
      return null;
    }

    return data as EssayRecord;
  } catch (error) {
    console.error('Error in saveEssay:', error);
    return null;
  }
}

// 获取用户的作文历史
export async function getEssayHistory(limit: number = 20): Promise<EssayRecord[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('essays')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching essay history:', error);
      return [];
    }

    return (data || []) as EssayRecord[];
  } catch (error) {
    console.error('Error in getEssayHistory:', error);
    return [];
  }
}

// 获取单条作文记录
export async function getEssayById(id: string): Promise<EssayRecord | null> {
  try {
    const { data, error } = await supabase
      .from('essays')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching essay:', error);
      return null;
    }

    return data as EssayRecord;
  } catch (error) {
    console.error('Error in getEssayById:', error);
    return null;
  }
}

// 删除作文记录
export async function deleteEssay(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('essays')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting essay:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEssay:', error);
    return false;
  }
}
