ALTER TABLE IF EXISTS error_diagnoses
  ADD COLUMN IF NOT EXISTS guardian_error_type VARCHAR(40)
    CHECK (
      guardian_error_type IS NULL OR guardian_error_type IN (
        'knowledge_blind_spot',
        'reading_mistake',
        'thinking_gap',
        'execution_slip',
        'exam_mindset'
      )
    ),
  ADD COLUMN IF NOT EXISTS root_cause_summary TEXT,
  ADD COLUMN IF NOT EXISTS child_poka_yoke_action TEXT,
  ADD COLUMN IF NOT EXISTS suggested_guardian_action TEXT,
  ADD COLUMN IF NOT EXISTS false_error_gate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analysis_mode VARCHAR(20)
    CHECK (
      analysis_mode IS NULL OR analysis_mode IN (
        'junior',
        'senior',
        'grade9_exam'
      )
    ),
  ADD COLUMN IF NOT EXISTS stuck_stage VARCHAR(40)
    CHECK (
      stuck_stage IS NULL OR stuck_stage IN (
        'read_question',
        'find_entry',
        'connect_reasoning',
        'stabilize_execution',
        'summarize_method'
      )
    );

ALTER TABLE IF EXISTS error_sessions
  ADD COLUMN IF NOT EXISTS guardian_error_type VARCHAR(40)
    CHECK (
      guardian_error_type IS NULL OR guardian_error_type IN (
        'knowledge_blind_spot',
        'reading_mistake',
        'thinking_gap',
        'execution_slip',
        'exam_mindset'
      )
    ),
  ADD COLUMN IF NOT EXISTS guardian_root_cause_summary TEXT,
  ADD COLUMN IF NOT EXISTS child_poka_yoke_action TEXT,
  ADD COLUMN IF NOT EXISTS suggested_guardian_action TEXT,
  ADD COLUMN IF NOT EXISTS false_error_gate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analysis_mode VARCHAR(20)
    CHECK (
      analysis_mode IS NULL OR analysis_mode IN (
        'junior',
        'senior',
        'grade9_exam'
      )
    ),
  ADD COLUMN IF NOT EXISTS stuck_stage VARCHAR(40)
    CHECK (
      stuck_stage IS NULL OR stuck_stage IN (
        'read_question',
        'find_entry',
        'connect_reasoning',
        'stabilize_execution',
        'summarize_method'
      )
    );

CREATE INDEX IF NOT EXISTS idx_error_diagnoses_guardian_error_type
  ON error_diagnoses(guardian_error_type);

CREATE INDEX IF NOT EXISTS idx_error_diagnoses_analysis_mode
  ON error_diagnoses(analysis_mode);

CREATE INDEX IF NOT EXISTS idx_error_sessions_guardian_error_type
  ON error_sessions(guardian_error_type);

CREATE INDEX IF NOT EXISTS idx_error_sessions_analysis_mode
  ON error_sessions(analysis_mode);

COMMENT ON COLUMN error_diagnoses.guardian_error_type IS 'Parent-facing 5-bucket error label for UI/report unification.';
COMMENT ON COLUMN error_diagnoses.root_cause_summary IS 'Short parent-readable summary generated from the structured diagnosis.';
COMMENT ON COLUMN error_diagnoses.child_poka_yoke_action IS 'Child-facing one-line anti-mistake action to rehearse later.';
COMMENT ON COLUMN error_diagnoses.suggested_guardian_action IS 'Guardian-facing next action generated from the current diagnosis.';
COMMENT ON COLUMN error_diagnoses.false_error_gate IS 'Whether this session should prefer a closed-book retry before deep re-analysis.';
COMMENT ON COLUMN error_diagnoses.analysis_mode IS 'Prompt / diagnosis mode derived from student stage, including grade 9 exam mode.';
COMMENT ON COLUMN error_diagnoses.stuck_stage IS 'Where the student is most likely blocked in the diagnosis-to-review chain.';

COMMENT ON COLUMN error_sessions.guardian_error_type IS 'Cached parent-facing 5-bucket error label for fast timeline and dashboard reads.';
COMMENT ON COLUMN error_sessions.guardian_root_cause_summary IS 'Cached parent-readable summary for session-level views.';
COMMENT ON COLUMN error_sessions.child_poka_yoke_action IS 'Cached child-facing anti-mistake action for review prompts.';
COMMENT ON COLUMN error_sessions.suggested_guardian_action IS 'Cached guardian-facing action for parent surfaces.';
COMMENT ON COLUMN error_sessions.false_error_gate IS 'Cached retry-first recommendation for pseudo / execution-like wrong answers.';
COMMENT ON COLUMN error_sessions.analysis_mode IS 'Cached analysis mode used by the current session.';
COMMENT ON COLUMN error_sessions.stuck_stage IS 'Cached current stuck stage used by parent-facing action prompts.';
