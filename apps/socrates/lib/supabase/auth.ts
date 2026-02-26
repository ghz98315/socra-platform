import { createClient } from './client';
import type { UserProfile } from './types';

const supabase = createClient();

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return { user: data.user };
}

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
      },
    },
  });

  if (error) {
    throw error;
  }

  return { user: data.user };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function updateProfile(data: Partial<UserProfile>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .update(data)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return profile;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    ...user,
    profile,
  };
}

export async function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
