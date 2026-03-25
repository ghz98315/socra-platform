-- =====================================================
-- Project Socrates - Math Error Loop V1 Tables
-- Structured diagnoses + review attempts for deep error-loop validation
-- =====================================================

CREATE TABLE IF NOT EXISTS error_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES error_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject VARCHAR(20) NOT NULL
    CHECK (subject IN ('math', 'chinese', 'english', 'physics', 'chemistry', 'generic')),
  surface_labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  surface_error TEXT NOT NULL,
  root_cause_category VARCHAR(40) NOT NULL
    CHECK (
      root_cause_category IN (
        'knowledge_gap',
        'concept_confusion',
        'problem_reading',
        'calculation_execution',
        'strategy_gap',
        'habit_issue',
        'attention_emotion',
        'pseudo_mastery'
      )
    ),
  root_cause_statement TEXT NOT NULL,
  root_cause_depth SMALLINT NOT NULL DEFAULT 1
    CHECK (root_cause_depth BETWEEN 1 AND 3),
  why_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  guided_reflection JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  fix_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  habit_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT error_diagnoses_session_unique UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_error_diagnoses_student_id ON error_diagnoses(student_id);
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_subject ON error_diagnoses(subject);
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_root_cause_category ON error_diagnoses(root_cause_category);
CREATE INDEX IF NOT EXISTS idx_error_diagnoses_updated_at ON error_diagnoses(updated_at DESC);

ALTER TABLE error_diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own error diagnoses" ON error_diagnoses;
DROP POLICY IF EXISTS "Students can insert their own error diagnoses" ON error_diagnoses;
DROP POLICY IF EXISTS "Students can update their own error diagnoses" ON error_diagnoses;

CREATE POLICY "Students can view their own error diagnoses"
  ON error_diagnoses FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own error diagnoses"
  ON error_diagnoses FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own error diagnoses"
  ON error_diagnoses FOR UPDATE
  USING (auth.uid() = student_id);

DROP TRIGGER IF EXISTS trg_error_diagnoses_updated_at ON error_diagnoses;
CREATE TRIGGER trg_error_diagnoses_updated_at
  BEFORE UPDATE ON error_diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE error_diagnoses IS 'Structured root-cause diagnosis for a single error session.';
COMMENT ON COLUMN error_diagnoses.surface_labels IS 'Observable surface labels such as carelessness or missed condition. Never the final root cause by itself.';
COMMENT ON COLUMN error_diagnoses.root_cause_depth IS '1=surface only, 2=behavior layer, 3=stable root pattern.';
COMMENT ON COLUMN error_diagnoses.why_chain IS '5-Why style reasoning chain captured as JSON.';
COMMENT ON COLUMN error_diagnoses.guided_reflection IS 'Persisted guided reflection steps and final student summary for Socrates-style follow-up.';

CREATE TABLE IF NOT EXISTS review_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES review_schedule(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES error_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL CHECK (attempt_no >= 1),
  attempt_mode VARCHAR(20) NOT NULL DEFAULT 'original'
    CHECK (attempt_mode IN ('original', 'variant', 'mixed')),
  independent_first BOOLEAN NOT NULL DEFAULT TRUE,
  asked_ai BOOLEAN NOT NULL DEFAULT FALSE,
  ai_hint_count INTEGER NOT NULL DEFAULT 0 CHECK (ai_hint_count >= 0),
  solved_correctly BOOLEAN NOT NULL DEFAULT FALSE,
  explained_correctly BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score SMALLINT CHECK (confidence_score BETWEEN 1 AND 5),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  variant_passed BOOLEAN,
  mastery_judgement VARCHAR(30) NOT NULL
    CHECK (
      mastery_judgement IN (
        'not_mastered',
        'assisted_correct',
        'explanation_gap',
        'pseudo_mastery',
        'provisional_mastered',
        'mastered'
      )
    ),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT review_attempts_review_attempt_no_unique UNIQUE (review_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_review_attempts_review_id ON review_attempts(review_id);
CREATE INDEX IF NOT EXISTS idx_review_attempts_session_id ON review_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_review_attempts_student_id ON review_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_review_attempts_mastery_judgement ON review_attempts(mastery_judgement);
CREATE INDEX IF NOT EXISTS idx_review_attempts_created_at ON review_attempts(created_at DESC);

ALTER TABLE review_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own review attempts" ON review_attempts;
DROP POLICY IF EXISTS "Students can insert their own review attempts" ON review_attempts;

CREATE POLICY "Students can view their own review attempts"
  ON review_attempts FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own review attempts"
  ON review_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

COMMENT ON TABLE review_attempts IS 'Evidence trail for each review attempt, used to judge true mastery vs pseudo-mastery.';
COMMENT ON COLUMN review_attempts.independent_first IS 'Whether the student attempted the question independently before receiving help.';
COMMENT ON COLUMN review_attempts.mastery_judgement IS 'System-level judgement derived from the attempt evidence.';

ALTER TABLE IF EXISTS review_schedule
  ADD COLUMN IF NOT EXISTS mastery_state VARCHAR(30) NOT NULL DEFAULT 'scheduled'
    CHECK (mastery_state IN ('scheduled', 'review_due', 'provisional_mastered', 'mastered_closed', 'reopened')),
  ADD COLUMN IF NOT EXISTS last_attempt_id UUID,
  ADD COLUMN IF NOT EXISTS last_judgement VARCHAR(30),
  ADD COLUMN IF NOT EXISTS close_reason TEXT,
  ADD COLUMN IF NOT EXISTS reopened_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS review_schedule
  DROP CONSTRAINT IF EXISTS review_schedule_last_attempt_id_fkey;

ALTER TABLE IF EXISTS review_schedule
  ADD CONSTRAINT review_schedule_last_attempt_id_fkey
  FOREIGN KEY (last_attempt_id) REFERENCES review_attempts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_review_schedule_mastery_state ON review_schedule(mastery_state);
CREATE INDEX IF NOT EXISTS idx_review_schedule_last_judgement ON review_schedule(last_judgement);

DROP TRIGGER IF EXISTS trg_review_schedule_updated_at ON review_schedule;
CREATE TRIGGER trg_review_schedule_updated_at
  BEFORE UPDATE ON review_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE IF EXISTS error_sessions
  ADD COLUMN IF NOT EXISTS primary_root_cause_category VARCHAR(40)
    CHECK (
      primary_root_cause_category IN (
        'knowledge_gap',
        'concept_confusion',
        'problem_reading',
        'calculation_execution',
        'strategy_gap',
        'habit_issue',
        'attention_emotion',
        'pseudo_mastery'
      )
    ),
  ADD COLUMN IF NOT EXISTS primary_root_cause_statement TEXT,
  ADD COLUMN IF NOT EXISTS closure_state VARCHAR(30) NOT NULL DEFAULT 'open'
    CHECK (closure_state IN ('open', 'provisional_mastered', 'mastered_closed', 'reopened'));

CREATE INDEX IF NOT EXISTS idx_error_sessions_primary_root_cause_category
  ON error_sessions(primary_root_cause_category);
CREATE INDEX IF NOT EXISTS idx_error_sessions_closure_state
  ON error_sessions(closure_state);
