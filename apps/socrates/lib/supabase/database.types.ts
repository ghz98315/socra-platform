// =====================================================
// Project Socrates - Supabase Database Types
// =====================================================
// This file defines the database schema types for Supabase
// Auto-generated types can be added later using Supabase CLI

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: 'student' | 'parent' | 'admin';
          theme_preference: 'junior' | 'senior' | null;
          grade_level: number | null;
          display_name: string | null;
          avatar_url: string | null;
          xp_points: number | null;
          phone: string | null;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: 'student' | 'parent' | 'admin';
          theme_preference?: 'junior' | 'senior' | null;
          grade_level?: number | null;
          display_name?: string | null;
          avatar_url?: string | null;
          xp_points?: number | null;
          phone?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: 'student' | 'parent' | 'admin';
          theme_preference?: 'junior' | 'senior' | null;
          grade_level?: number | null;
          display_name?: string | null;
          avatar_url?: string | null;
          xp_points?: number | null;
          phone?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
      };
      error_sessions: {
        Row: {
          id: string;
          student_id: string;
          subject: 'math' | 'physics' | 'chemistry';
          original_image_url: string | null;
          extracted_text: string | null;
          status: string | null;
          difficulty_rating: number | null;
          concept_tags: string[] | null;
          theme_used: 'junior' | 'senior' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject?: 'math' | 'physics' | 'chemistry';
          original_image_url?: string | null;
          extracted_text?: string | null;
          status?: string | null;
          difficulty_rating?: number | null;
          concept_tags?: string[] | null;
          theme_used?: 'junior' | 'senior' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: 'math' | 'physics' | 'chemistry';
          original_image_url?: string | null;
          extracted_text?: string | null;
          status?: string | null;
          difficulty_rating?: number | null;
          concept_tags?: string[] | null;
          theme_used?: 'junior' | 'senior' | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          student_id: string;
          session_type: string;
          start_time: string;
          end_time: string | null;
          duration_seconds: number | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          session_type?: string;
          start_time?: string;
          end_time?: string | null;
          duration_seconds?: number | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          session_type?: string;
          start_time?: string;
          end_time?: string | null;
          duration_seconds?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
