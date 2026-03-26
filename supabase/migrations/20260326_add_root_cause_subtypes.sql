ALTER TABLE IF EXISTS error_diagnoses
  ADD COLUMN IF NOT EXISTS root_cause_subtype VARCHAR(80)
    CHECK (
      root_cause_subtype IS NULL OR root_cause_subtype IN (
        'definition_recall_unstable',
        'formula_condition_missing',
        'knowledge_link_disconnected',
        'concept_boundary_blur',
        'symbol_semantics_confused',
        'representation_mapping_confused',
        'missed_condition',
        'goal_target_misaligned',
        'quantity_relation_misread',
        'sign_operation_slip',
        'draft_management_disorder',
        'step_skipping_instability',
        'no_entry_strategy',
        'single_path_dependency',
        'decomposition_planning_weak',
        'condition_marking_missing',
        'verification_routine_missing',
        'simple_problem_rush',
        'time_pressure_panic',
        'frustration_shutdown',
        'attention_drift',
        'prompt_dependency',
        'original_only_transfer_fail',
        'answer_without_explanation'
      )
    );

ALTER TABLE IF EXISTS error_sessions
  ADD COLUMN IF NOT EXISTS primary_root_cause_subtype VARCHAR(80)
    CHECK (
      primary_root_cause_subtype IS NULL OR primary_root_cause_subtype IN (
        'definition_recall_unstable',
        'formula_condition_missing',
        'knowledge_link_disconnected',
        'concept_boundary_blur',
        'symbol_semantics_confused',
        'representation_mapping_confused',
        'missed_condition',
        'goal_target_misaligned',
        'quantity_relation_misread',
        'sign_operation_slip',
        'draft_management_disorder',
        'step_skipping_instability',
        'no_entry_strategy',
        'single_path_dependency',
        'decomposition_planning_weak',
        'condition_marking_missing',
        'verification_routine_missing',
        'simple_problem_rush',
        'time_pressure_panic',
        'frustration_shutdown',
        'attention_drift',
        'prompt_dependency',
        'original_only_transfer_fail',
        'answer_without_explanation'
      )
    );

CREATE INDEX IF NOT EXISTS idx_error_diagnoses_root_cause_subtype
  ON error_diagnoses(root_cause_subtype);

CREATE INDEX IF NOT EXISTS idx_error_sessions_primary_root_cause_subtype
  ON error_sessions(primary_root_cause_subtype);

COMMENT ON COLUMN error_diagnoses.root_cause_subtype IS 'Second-level actionable subtype under the main root cause category.';
COMMENT ON COLUMN error_sessions.primary_root_cause_subtype IS 'Cached second-level root cause subtype for fast student/parent views.';
