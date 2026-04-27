import { NextResponse, type NextRequest } from 'next/server';

import {
  getOtpTypeForPurpose,
  hashVerificationCode,
  isValidMainlandPhone,
  isValidVerificationCode,
  normalizePhone,
  type PhoneCodePurpose,
  phoneToPseudoEmail,
} from '@/lib/auth/phone-auth';
import {
  isPhoneCodeAuthEnabled,
  PHONE_CODE_AUTH_DISABLED_MESSAGE,
} from '@/lib/auth/phone-auth-config';
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
} from '@/lib/server/supabase-auth-clients';

type VerificationRecord = {
  id: string;
  phone: string;
  purpose: PhoneCodePurpose;
  code_hash: string;
  supabase_otp_type: string;
  expires_at: string;
  metadata: {
    profile_payload?: {
      display_name?: string;
      avatar_url?: string | null;
      student_avatar_url?: string | null;
      parent_avatar_url?: string | null;
    };
  } | null;
};

async function syncVerifiedUserProfile(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  user: any,
  phone: string,
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, string | null | undefined>;
  const displayName = metadata.display_name || phone;
  const avatarUrl = metadata.avatar_url || metadata.student_avatar_url || null;
  const studentAvatarUrl = metadata.student_avatar_url || avatarUrl || null;
  const parentAvatarUrl = metadata.parent_avatar_url || avatarUrl || null;
  const requestedRole = metadata.role === 'parent' || metadata.role === 'student' ? metadata.role : null;

  const { data: existingProfileRaw } = await admin
    .from('profiles')
    .select('id, role, phone, display_name, avatar_url, student_avatar_url, parent_avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const existingProfile = existingProfileRaw as
    | {
        id: string;
        role: string;
        phone: string | null;
        display_name: string | null;
        avatar_url: string | null;
        student_avatar_url: string | null;
        parent_avatar_url: string | null;
      }
    | null;

  if (existingProfile) {
    const updates: Record<string, string | null> = {};

    if (!existingProfile.phone) updates.phone = phone;
    if (!existingProfile.display_name && displayName) updates.display_name = displayName;
    if (!existingProfile.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;
    if (!existingProfile.student_avatar_url && studentAvatarUrl) {
      updates.student_avatar_url = studentAvatarUrl;
    }
    if (!existingProfile.parent_avatar_url && parentAvatarUrl) {
      updates.parent_avatar_url = parentAvatarUrl;
    }
    if (requestedRole && existingProfile.role !== requestedRole) {
      updates.role = requestedRole;
    }

    if (Object.keys(updates).length > 0) {
      await (admin as any).from('profiles').update(updates).eq('id', user.id);
    }

    return;
  }

  await (admin as any).from('profiles').upsert(
    {
      id: user.id,
      phone,
      display_name: displayName,
      avatar_url: avatarUrl,
      student_avatar_url: studentAvatarUrl,
      parent_avatar_url: parentAvatarUrl,
      role: requestedRole || 'student',
      theme_preference: 'junior',
    },
    { onConflict: 'id' },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const purpose = body.purpose === 'register' ? 'register' : 'login';
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!isPhoneCodeAuthEnabled()) {
      return NextResponse.json(
        { error: PHONE_CODE_AUTH_DISABLED_MESSAGE },
        { status: 503 },
      );
    }

    if (!isValidMainlandPhone(phone)) {
      return NextResponse.json({ error: '请输入正确的 11 位手机号。' }, { status: 400 });
    }

    if (!isValidVerificationCode(code)) {
      return NextResponse.json({ error: '请输入正确的 6 到 8 位验证码。' }, { status: 400 });
    }

    if (purpose === 'register' && password.length < 6) {
      return NextResponse.json({ error: '密码至少需要 6 位。' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const supabase = createSupabasePublicClient();
    const db = admin as any;

    const { data: verificationRecord, error: recordError } = await db
      .from('auth_verification_codes')
      .select('id, phone, purpose, code_hash, supabase_otp_type, expires_at, metadata')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recordError) {
      console.error('[auth/verify-code] failed to load record:', recordError);
      return NextResponse.json({ error: '验证码校验失败，请稍后重试。' }, { status: 500 });
    }

    if (!verificationRecord) {
      return NextResponse.json({ error: '请先获取验证码。' }, { status: 400 });
    }

    const record = verificationRecord as VerificationRecord;

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: '验证码已过期，请重新获取。' }, { status: 400 });
    }

    if (hashVerificationCode(code) !== record.code_hash) {
      return NextResponse.json({ error: '验证码错误，请重新输入。' }, { status: 400 });
    }

    const pseudoEmail = phoneToPseudoEmail(phone);
    const otpType = (record.supabase_otp_type || getOtpTypeForPurpose(purpose)) as any;
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: pseudoEmail,
      token: code,
      type: otpType,
    });

    if (verifyError || !verifyData.session || !verifyData.user) {
      console.error('[auth/verify-code] verifyOtp failed:', verifyError);
      return NextResponse.json({ error: '验证码校验失败，请重新获取后再试。' }, { status: 400 });
    }

    const verifiedUser = verifyData.user;
    const verifiedSession = verifyData.session;

    await syncVerifiedUserProfile(admin, verifiedUser, phone);

    if (purpose === 'register') {
      const nextMetadata = {
        ...(verifiedUser.user_metadata || {}),
        phone_auth_pending: false,
        phone_verified_at: new Date().toISOString(),
      };

      await admin.auth.admin.updateUserById(verifiedUser.id, {
        password,
        user_metadata: nextMetadata,
      });
    }

    await db.from('user_auth_identities').upsert(
      {
        user_id: verifiedUser.id,
        provider: 'phone',
        provider_user_id: phone,
        phone,
        is_primary: true,
        metadata: {
          pseudo_email: pseudoEmail,
        },
      },
      {
        onConflict: 'provider,provider_user_id',
      },
    );

    await db
      .from('auth_verification_codes')
      .update({
        consumed_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    return NextResponse.json({
      success: true,
      session: {
        access_token: verifiedSession.access_token,
        refresh_token: verifiedSession.refresh_token,
      },
      user: verifiedUser,
      isNewUser: purpose === 'register',
    });
  } catch (error) {
    console.error('[auth/verify-code] unexpected error:', error);
    return NextResponse.json({ error: '验证码校验失败，请稍后重试。' }, { status: 500 });
  }
}
