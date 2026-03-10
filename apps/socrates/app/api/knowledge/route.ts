// =====================================================
// Project Socrates - Knowledge Graph API
// 知识图谱 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取知识节点和用户掌握度
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const subject = searchParams.get('subject');
    const gradeLevel = searchParams.get('grade_level');
    const nodeId = searchParams.get('node_id');

    // 获取单个节点详情
    if (nodeId) {
      const { data: node, error: nodeError } = await supabase
        .from('knowledge_nodes')
        .select('*')
        .eq('id', nodeId)
        .single();

      if (nodeError) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      // 获取用户掌握度
      let mastery = null;
      if (userId) {
        const { data: masteryData } = await supabase
          .from('user_knowledge_mastery')
          .select('*')
          .eq('user_id', userId)
          .eq('node_id', nodeId)
          .single();
        mastery = masteryData;
      }

      return NextResponse.json({ node, mastery });
    }

    // 构建查询
    let query = supabase.from('knowledge_nodes').select('*');

    // 按科目筛选
    if (subject) {
      query = query.eq('subject', subject);
    }

    // 按年级筛选
    if (gradeLevel) {
      query = query.eq('grade_level', parseInt(gradeLevel));
    }

    // 获取知识节点
    const { data: nodes, error: nodesError } = await query.order('subject').order('grade_level');

    if (nodesError) {
      console.error('[Knowledge API] Error fetching nodes:', nodesError);
      throw nodesError;
    }

    // 获取用户掌握度
    let mastery: any[] = [];
    if (userId) {
      const { data: masteryData, error: masteryError } = await supabase
        .from('user_knowledge_mastery')
        .select('*')
        .eq('user_id', userId);

      if (masteryError && masteryError.code !== 'PGRST116') {
        console.error('[Knowledge API] Error fetching mastery:', masteryError);
      }
      mastery = masteryData || [];
    }

    return NextResponse.json({
      nodes: nodes || [],
      mastery,
    });
  } catch (error: any) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建知识节点 (管理员功能)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      parentId,
      subject,
      gradeLevel,
      chapter,
      difficulty,
      description,
      keyPoints,
      prerequisites,
    } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'subject and description are required' },
        { status: 400 }
      );
    }

    const { data: node, error: nodeError } = await supabase
      .from('knowledge_nodes')
      .insert({
        parent_id: parentId || null,
        subject,
        grade_level: gradeLevel || null,
        chapter: chapter || null,
        difficulty: difficulty || 3,
        description,
        key_points: keyPoints || null,
        prerequisites: prerequisites || null,
      })
      .select()
      .single();

    if (nodeError) {
      console.error('[Knowledge API] Error creating node:', nodeError);
      throw nodeError;
    }

    return NextResponse.json({
      success: true,
      node,
    });
  } catch (error: any) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 更新用户掌握度
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      nodeId,
      masteryLevel,
      confidenceScore,
      lastPracticeType,
      notes,
      strengths,
      weaknesses,
    } = body;

    if (!userId || !nodeId) {
      return NextResponse.json(
        { error: 'userId and nodeId are required' },
        { status: 400 }
      );
    }

    // 检查是否已有记录
    const { data: existing } = await supabase
      .from('user_knowledge_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // 更新现有记录
      const updateData: any = {
        updated_at: now,
        last_review_at: now,
        review_count: (existing.review_count || 0) + 1,
      };

      if (masteryLevel !== undefined) {
        updateData.mastery_level = masteryLevel;
        // 如果掌握度提升，增加连续天数
        if (masteryLevel > existing.mastery_level) {
          updateData.streak_days = (existing.streak_days || 0) + 1;
          updateData.consecutive_correct_days = (existing.consecutive_correct_days || 0) + 1;
        }
      }

      if (confidenceScore !== undefined) {
        updateData.confidence_score = confidenceScore;
      }

      if (lastPracticeType) {
        updateData.last_practice_type = lastPracticeType;
        updateData.last_practice_at = now;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (strengths !== undefined) {
        updateData.strengths = strengths;
      }

      if (weaknesses !== undefined) {
        updateData.weaknesses = weaknesses;
      }

      const { data: updated, error: updateError } = await supabase
        .from('user_knowledge_mastery')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Knowledge API] Error updating mastery:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        mastery: updated,
      });
    } else {
      // 创建新记录
      const { data: created, error: createError } = await supabase
        .from('user_knowledge_mastery')
        .insert({
          user_id: userId,
          node_id: nodeId,
          mastery_level: masteryLevel || 1,
          confidence_score: confidenceScore || 0,
          last_review_at: now,
          review_count: 1,
          last_practice_at: now,
          last_practice_type: lastPracticeType || 'initial',
          notes: notes || null,
          streak_days: 1,
          consecutive_correct_days: 1,
          practice_duration_minutes: 0,
          strengths: strengths || [],
          weaknesses: weaknesses || [],
        })
        .select()
        .single();

      if (createError) {
        console.error('[Knowledge API] Error creating mastery:', createError);
        throw createError;
      }

      return NextResponse.json({
        success: true,
        mastery: created,
      });
    }
  } catch (error: any) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除知识节点 (管理员功能)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get('node_id');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'node_id is required' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('knowledge_nodes')
      .delete()
      .eq('id', nodeId);

    if (deleteError) {
      console.error('[Knowledge API] Error deleting node:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Node deleted',
    });
  } catch (error: any) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
