import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SortBy = 'newest' | 'oldest' | 'difficulty';
type ErrorStatus = 'analyzing' | 'guided_learning' | 'mastered';
type ErrorSubject = 'math' | 'physics' | 'chemistry';

const VALID_SORTS = new Set<SortBy>(['newest', 'oldest', 'difficulty']);
const VALID_STATUSES = new Set<ErrorStatus>(['analyzing', 'guided_learning', 'mastered']);
const VALID_SUBJECTS = new Set<ErrorSubject>(['math', 'physics', 'chemistry']);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const query = (searchParams.get('q') || '').trim();
    const subject = searchParams.get('subject') || 'all';
    const status = searchParams.get('status') || 'all';
    const sortBy = (searchParams.get('sort_by') || 'newest') as SortBy;
    const page = Math.max(Number(searchParams.get('page') || '1'), 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get('page_size') || '24'), 1), 60);

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    const safeSort = VALID_SORTS.has(sortBy) ? sortBy : 'newest';
    const safeSubject = VALID_SUBJECTS.has(subject as ErrorSubject) ? subject : 'all';
    const safeStatus = VALID_STATUSES.has(status as ErrorStatus) ? status : 'all';

    let listQuery = supabase
      .from('error_sessions')
      .select(`
        id,
        student_id,
        subject,
        original_image_url,
        extracted_text,
        status,
        difficulty_rating,
        concept_tags,
        created_at
      `, { count: 'exact' })
      .eq('student_id', studentId);

    if (safeSubject !== 'all') {
      listQuery = listQuery.eq('subject', safeSubject);
    }

    if (safeStatus !== 'all') {
      listQuery = listQuery.eq('status', safeStatus);
    }

    if (query) {
      const escaped = query.replace(/[%_]/g, '');
      listQuery = listQuery.ilike('extracted_text', `%${escaped}%`);
    }

    if (safeSort === 'difficulty') {
      listQuery = listQuery.order('difficulty_rating', { ascending: false, nullsFirst: false });
      listQuery = listQuery.order('created_at', { ascending: false });
    } else {
      listQuery = listQuery.order('created_at', { ascending: safeSort === 'oldest' });
    }

    listQuery = listQuery.range((page - 1) * pageSize, page * pageSize - 1);

    const [errorsResult, statsResult] = await Promise.all([
      listQuery,
      supabase
        .from('error_sessions')
        .select('id, status')
        .eq('student_id', studentId),
    ]);

    if (errorsResult.error) {
      console.error('[error-book] Failed to load error sessions:', errorsResult.error);
      return NextResponse.json({ error: 'Failed to fetch error sessions' }, { status: 500 });
    }

    if (statsResult.error) {
      console.error('[error-book] Failed to load error stats:', statsResult.error);
      return NextResponse.json({ error: 'Failed to fetch error stats' }, { status: 500 });
    }

    const pageItems = errorsResult.data || [];
    const sessionIds = pageItems.map((item: { id: string }) => item.id);

    const reviewResult = sessionIds.length > 0
      ? await supabase
          .from('review_schedule')
          .select('id, session_id')
          .eq('student_id', studentId)
          .in('session_id', sessionIds)
      : { data: [], error: null };

    if (reviewResult.error) {
      console.error('[error-book] Failed to load review schedule:', reviewResult.error);
      return NextResponse.json({ error: 'Failed to fetch review schedule' }, { status: 500 });
    }

    const statsRows = statsResult.data || [];

    const reviewRows = reviewResult.data || [];
    const reviewSessionMap = Object.fromEntries(
      reviewRows.map((row: { id: string; session_id: string }) => [row.session_id, row.id])
    );

    return NextResponse.json({
      data: pageItems,
      review_session_ids: reviewRows.map((row: { session_id: string }) => row.session_id),
      review_session_map: reviewSessionMap,
      count: errorsResult.count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.max(Math.ceil((errorsResult.count || 0) / pageSize), 1),
      stats: {
        total: statsRows.length,
        analyzing: statsRows.filter((row: { status: string }) => row.status === 'analyzing').length,
        guided_learning: statsRows.filter((row: { status: string }) => row.status === 'guided_learning').length,
        mastered: statsRows.filter((row: { status: string }) => row.status === 'mastered').length,
      },
    });
  } catch (error: any) {
    console.error('[error-book] API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
