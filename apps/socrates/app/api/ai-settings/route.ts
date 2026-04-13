// =====================================================
// Project Socrates - AI Model Settings API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

import {
  getModelsForPurpose,
  normalizeModelSelection,
} from '@/lib/ai-models/config';
import type { ModelPurpose, UserModelPreference } from '@/lib/ai-models/types';

// Temporary in-memory storage. Replace with DB persistence when settings are formalized.
const userPreferences: Map<string, UserModelPreference> = new Map();

function buildNormalizedPreference(
  userId: string,
  rawPreference?: Partial<UserModelPreference> | null,
): UserModelPreference {
  return {
    user_id: userId,
    chat_model: normalizeModelSelection(rawPreference?.chat_model, 'chat').id,
    vision_model: normalizeModelSelection(rawPreference?.vision_model, 'vision').id,
    reasoning_model: normalizeModelSelection(rawPreference?.reasoning_model, 'reasoning').id,
    updated_at: rawPreference?.updated_at || new Date().toISOString(),
  };
}

function getSelectableModels() {
  const modelsByPurpose: Record<ModelPurpose, ReturnType<typeof getModelsForPurpose>> = {
    chat: getModelsForPurpose('chat'),
    vision: getModelsForPurpose('vision'),
    reasoning: getModelsForPurpose('reasoning'),
  };

  return Array.from(
    new Map(
      Object.values(modelsByPurpose)
        .flat()
        .map((model) => [model.id, model]),
    ).values(),
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');
    const models = getSelectableModels();

    let preference = userId ? userPreferences.get(userId) : null;

    if (userId) {
      preference = buildNormalizedPreference(userId, preference || undefined);
      userPreferences.set(userId, preference);
    }

    return NextResponse.json({
      data: {
        models,
        preference: preference || null,
      },
    });
  } catch (error: unknown) {
    console.error('AI Settings GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load AI settings' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id: userId, chat_model: chatModel, vision_model: visionModel, reasoning_model: reasoningModel } = body;

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const preference = buildNormalizedPreference(userId, {
      user_id: userId,
      chat_model: chatModel,
      vision_model: visionModel,
      reasoning_model: reasoningModel,
      updated_at: new Date().toISOString(),
    });

    userPreferences.set(userId, preference);

    return NextResponse.json({
      success: true,
      data: preference,
    });
  } catch (error: unknown) {
    console.error('AI Settings POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save AI settings' },
      { status: 500 },
    );
  }
}
