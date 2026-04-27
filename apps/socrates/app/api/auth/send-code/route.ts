import { NextResponse, type NextRequest } from 'next/server';

import {
  formatOtpMessage,
  generateRandomPassword,
  getMaxSendAttemptsPerWindow,
  getMaxSendAttemptsPerIpWindow,
  getOtpExpiryMinutes,
  getOtpTypeForPurpose,
  getResendCooldownSeconds,
  hashVerificationCode,
  isValidMainlandPhone,
  normalizePhone,
  type PhoneCodeProfilePayload,
  type PhoneCodePurpose,
  phoneToPseudoEmail,
} from '@/lib/auth/phone-auth';
import {
  isPhoneCodeAuthEnabled,
  PHONE_CODE_AUTH_DISABLED_MESSAGE,
} from '@/lib/auth/phone-auth-config';
import { sendVerificationSms } from '@/lib/auth/sms-provider';
import { createSupabaseAdminClient } from '@/lib/server/supabase-auth-clients';

function getRequestIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? null;
  }

  return req.headers.get('x-real-ip');
}

function getProfilePayload(body: Record<string, unknown>): PhoneCodeProfilePayload {
  return {
    display_name: typeof body.display_name === 'string' ? body.display_name : undefined,
    avatar_url: typeof body.avatar_url === 'string' ? body.avatar_url : null,
    student_avatar_url:
      typeof body.student_avatar_url === 'string' ? body.student_avatar_url : null,
    parent_avatar_url:
      typeof body.parent_avatar_url === 'string' ? body.parent_avatar_url : null,
  };
}

function getWindowRetryAfterSeconds(now: number, oldestCreatedAt: string) {
  const elapsedSeconds = Math.floor((now - new Date(oldestCreatedAt).getTime()) / 1000);
  return Math.max(1, 10 * 60 - elapsedSeconds);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const purpose = body.purpose === 'register' ? 'register' : 'login';
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const profilePayload = getProfilePayload(body);

    if (!isPhoneCodeAuthEnabled()) {
      return NextResponse.json(
        { error: PHONE_CODE_AUTH_DISABLED_MESSAGE },
        { status: 503 },
      );
    }

    if (!isValidMainlandPhone(phone)) {
      return NextResponse.json({ error: '请输入正确的 11 位手机号。' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const authAdmin = admin.auth.admin;
    const pseudoEmail = phoneToPseudoEmail(phone);
    const cooldownSeconds = getResendCooldownSeconds();
    const maxAttemptsPerWindow = getMaxSendAttemptsPerWindow();
    const maxAttemptsPerIpWindow = getMaxSendAttemptsPerIpWindow();
    const expiryMinutes = getOtpExpiryMinutes();
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const requestIp = getRequestIp(req);
    const db = admin as any;

    const { data: authUsers } = await authAdmin.listUsers();
    const existingUser = authUsers.users.find((user) => user.email === pseudoEmail) ?? null;

    if (purpose === 'login' && !existingUser) {
      return NextResponse.json({ error: '该手机号未注册，请先使用注册验证码创建账号。' }, { status: 400 });
    }

    const { data: recentCodes, error: recentCodesError } = await db
      .from('auth_verification_codes')
      .select('id, created_at')
      .eq('phone', phone)
      .eq('purpose', purpose)
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (recentCodesError) {
      console.error('[auth/send-code] failed to query recent codes:', recentCodesError);
      return NextResponse.json({ error: '验证码服务暂时不可用，请稍后重试。' }, { status: 500 });
    }

    if (recentCodes.length >= maxAttemptsPerWindow) {
      const retryAfterSeconds = getWindowRetryAfterSeconds(
        now,
        recentCodes[recentCodes.length - 1].created_at,
      );
      return NextResponse.json(
        {
          error: '该手机号验证码发送过于频繁，请 10 分钟后再试。',
          retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    if (requestIp) {
      const { data: recentCodesByIp, error: recentCodesByIpError } = await db
        .from('auth_verification_codes')
        .select('id, created_at')
        .eq('send_ip', requestIp)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

      if (recentCodesByIpError) {
        console.error('[auth/send-code] failed to query recent codes by ip:', recentCodesByIpError);
        return NextResponse.json({ error: '验证码服务暂时不可用，请稍后重试。' }, { status: 500 });
      }

      if (recentCodesByIp.length >= maxAttemptsPerIpWindow) {
        const retryAfterSeconds = getWindowRetryAfterSeconds(
          now,
          recentCodesByIp[recentCodesByIp.length - 1].created_at,
        );
        return NextResponse.json(
          {
            error: '当前网络请求过于频繁，请稍后再试。',
            retryAfterSeconds,
          },
          { status: 429 },
        );
      }
    }

    const latestCode = recentCodes[0];
    if (latestCode) {
      const secondsSinceLastSend = Math.floor((now - new Date(latestCode.created_at).getTime()) / 1000);
      if (secondsSinceLastSend < cooldownSeconds) {
        return NextResponse.json(
          {
            error: `发送过于频繁，请 ${cooldownSeconds - secondsSinceLastSend} 秒后再试。`,
            retryAfterSeconds: cooldownSeconds - secondsSinceLastSend,
          },
          { status: 429 },
        );
      }
    }

    let targetUser = existingUser;
    let otpType = getOtpTypeForPurpose(purpose);

    if (purpose === 'register' && !targetUser) {
      const { data: createdUserData, error: createUserError } = await authAdmin.createUser({
        email: pseudoEmail,
        password: generateRandomPassword(),
        email_confirm: true,
        user_metadata: {
          phone,
          role: 'parent',
          ...profilePayload,
          phone_auth_pending: true,
        },
      });

      if (createUserError || !createdUserData.user) {
        console.error('[auth/send-code] createUser failed for register flow:', createUserError);
        return NextResponse.json({ error: '验证码生成失败，请稍后重试。' }, { status: 500 });
      }

      const createdTargetUser = createdUserData.user;
      targetUser = createdTargetUser;

      await db.from('profiles').upsert(
        {
          id: createdTargetUser.id,
          phone,
          display_name: profilePayload.display_name || phone,
          avatar_url: profilePayload.avatar_url,
          student_avatar_url: profilePayload.student_avatar_url || profilePayload.avatar_url,
          parent_avatar_url: profilePayload.parent_avatar_url || profilePayload.avatar_url,
          role: 'parent',
          theme_preference: 'junior',
        },
        { onConflict: 'id' },
      );

      otpType = 'magiclink';
    }

    if (purpose === 'register' && targetUser) {
      const registerTargetUser = targetUser;
      const isPending = registerTargetUser.user_metadata?.phone_auth_pending === true;
      if (!isPending && existingUser) {
        return NextResponse.json({ error: '该手机号已注册，请直接登录。' }, { status: 400 });
      }
      otpType = 'magiclink';
    }

    const linkPayload: Record<string, unknown> = {
      type: otpType,
      email: pseudoEmail,
    };

    const { data: linkData, error: linkError } = await (authAdmin as any).generateLink(linkPayload);
    if (linkError) {
      console.error('[auth/send-code] generateLink failed:', linkError);
      return NextResponse.json({ error: '验证码生成失败，请稍后重试。' }, { status: 500 });
    }

    const otpCode =
      linkData?.properties?.email_otp ??
      linkData?.properties?.emailOtp ??
      null;

    if (!otpCode) {
      console.error('[auth/send-code] missing email_otp in generateLink response');
      return NextResponse.json({ error: '验证码生成失败，请稍后重试。' }, { status: 500 });
    }

    const smsMessage = formatOtpMessage(otpCode, expiryMinutes);
    const smsResult = await sendVerificationSms(phone, smsMessage, otpCode, expiryMinutes);

    const expiresAt = new Date(now + expiryMinutes * 60 * 1000).toISOString();
    const insertPayload = {
      phone,
      purpose,
      provider: smsResult.provider,
      code_hash: hashVerificationCode(otpCode),
      supabase_otp_type: otpType,
      provider_message_id: smsResult.messageId ?? null,
      send_ip: requestIp,
      user_agent: req.headers.get('user-agent'),
      metadata: {
        pseudo_email: pseudoEmail,
        profile_payload: profilePayload,
        target_user_id: targetUser?.id ?? linkData?.user?.id ?? null,
      },
      expires_at: expiresAt,
    };

    const { error: insertError } = await db.from('auth_verification_codes').insert(insertPayload);
    if (insertError) {
      console.error('[auth/send-code] failed to persist code record:', insertError);
      return NextResponse.json({ error: '验证码发送失败，请稍后重试。' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expiresInSeconds: expiryMinutes * 60,
      retryAfterSeconds: cooldownSeconds,
      debugCode: smsResult.debugCode,
    });
  } catch (error) {
    console.error('[auth/send-code] unexpected error:', error);
    return NextResponse.json({ error: '验证码服务暂时不可用，请稍后重试。' }, { status: 500 });
  }
}
