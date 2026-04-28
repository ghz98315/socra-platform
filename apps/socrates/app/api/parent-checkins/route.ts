import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getAuthenticatedParentProfile } from '@/lib/server/route-auth';
import {
  buildDailyCheckinSummary,
  buildSuggestedParentPrompt,
  DAILY_CHECKIN_STATUS_LABELS,
  getShanghaiDateKey,
  GUARDIAN_SIGNAL_LABELS,
  resolveStuckStageLabel,
  type DailyCheckinStatus,
  type GuardianSignalLevel,
} from '@/lib/error-loop/guardian-checkin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type TopBlockerPayload = {
  label?: string | null;
  stuck_stage?: string | null;
  child_poka_yoke_action?: string | null;
  suggested_guardian_action?: string | null;
  false_error_gate?: boolean;
};

async function resolveOwnedStudent(parentId: string, studentId?: string | null) {
  const normalizedStudentId = String(studentId || '').trim();
  if (!normalizedStudentId) {
    return { error: NextResponse.json({ error: 'student_id is required' }, { status: 400 }) };
  }

  const { data: student, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', normalizedStudentId)
    .eq('role', 'student')
    .eq('parent_id', parentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!student) {
    return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
  }

  return { student };
}

function normalizeStatus(value: unknown): DailyCheckinStatus | null {
  if (value === 'completed' || value === 'stuck' || value === 'unfinished') {
    return value;
  }

  return null;
}

function normalizeSignal(value: unknown): GuardianSignalLevel | null {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value;
  }

  return null;
}

function normalizeNote(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    String(error.message || '').includes('parent_daily_checkins')
  );
}

function shapeCheckinResponse(record: {
  checkin_date: string;
  status: string;
  note: string | null;
  guardian_signal: string | null;
  top_blocker_label: string | null;
  stuck_stage: string | null;
  suggested_parent_prompt: string | null;
  updated_at: string;
}) {
  const status = normalizeStatus(record.status);
  const guardianSignal = normalizeSignal(record.guardian_signal);

  if (!status) {
    return null;
  }

  return {
    checkin_date: record.checkin_date,
    status,
    status_label: DAILY_CHECKIN_STATUS_LABELS[status],
    note: record.note,
    guardian_signal: guardianSignal,
    guardian_signal_label: guardianSignal ? GUARDIAN_SIGNAL_LABELS[guardianSignal] : null,
    top_blocker_label: record.top_blocker_label,
    stuck_stage: record.stuck_stage,
    stuck_stage_label: resolveStuckStageLabel(record.stuck_stage),
    suggested_parent_prompt: record.suggested_parent_prompt,
    status_summary: buildDailyCheckinSummary({
      status,
      topBlockerLabel: record.top_blocker_label,
      guardianSignal,
    }),
    updated_at: record.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const parent = await getAuthenticatedParentProfile();
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentResolved = await resolveOwnedStudent(parent.id, req.nextUrl.searchParams.get('student_id'));
    if (studentResolved.error) {
      return studentResolved.error;
    }

    const checkinDate = req.nextUrl.searchParams.get('date')?.trim() || getShanghaiDateKey();
    const { data, error } = await supabase
      .from('parent_daily_checkins')
      .select(
        'checkin_date, status, note, guardian_signal, top_blocker_label, stuck_stage, suggested_parent_prompt, updated_at',
      )
      .eq('parent_id', parent.id)
      .eq('student_id', studentResolved.student.id)
      .eq('checkin_date', checkinDate)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ success: true, data: null });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data ? shapeCheckinResponse(data) : null,
    });
  } catch (error) {
    console.error('[parent-checkins] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parent = await getAuthenticatedParentProfile();
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const status = normalizeStatus(body?.status);
    if (!status) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const studentResolved = await resolveOwnedStudent(parent.id, body?.student_id);
    if (studentResolved.error) {
      return studentResolved.error;
    }

    const topBlocker = (body?.top_blocker || {}) as TopBlockerPayload;
    const guardianSignal = normalizeSignal(body?.guardian_signal?.level || body?.guardian_signal);
    const note = normalizeNote(body?.note);
    const checkinDate = getShanghaiDateKey();
    const suggestedParentPrompt = buildSuggestedParentPrompt({
      status,
      topBlockerLabel: topBlocker.label,
      stuckStage: topBlocker.stuck_stage,
      childPokaYokeAction: topBlocker.child_poka_yoke_action,
      suggestedGuardianAction: topBlocker.suggested_guardian_action,
      falseErrorGate: topBlocker.false_error_gate === true,
    });

    const payload = {
      parent_id: parent.id,
      student_id: studentResolved.student.id,
      checkin_date: checkinDate,
      status,
      note,
      guardian_signal: guardianSignal,
      top_blocker_label: topBlocker.label?.trim() || null,
      stuck_stage: topBlocker.stuck_stage?.trim() || null,
      suggested_parent_prompt: suggestedParentPrompt,
    };

    const { data, error } = await supabase
      .from('parent_daily_checkins')
      .upsert(payload, { onConflict: 'parent_id,student_id,checkin_date' })
      .select(
        'checkin_date, status, note, guardian_signal, top_blocker_label, stuck_stage, suggested_parent_prompt, updated_at',
      )
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          { error: 'parent_daily_checkins table is not ready yet. Apply the latest Supabase migration first.' },
          { status: 503 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: shapeCheckinResponse(data),
    });
  } catch (error) {
    console.error('[parent-checkins] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
