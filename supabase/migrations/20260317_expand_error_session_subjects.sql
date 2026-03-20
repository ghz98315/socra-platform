-- Expand legacy error_sessions subject support for multisubject study/review bridges.
-- This keeps the old review chain writable for chinese / english / generic assets.

ALTER TABLE error_sessions
  DROP CONSTRAINT IF EXISTS error_sessions_subject_check;

ALTER TABLE error_sessions
  ADD CONSTRAINT error_sessions_subject_check
  CHECK (subject IN ('math', 'chinese', 'english', 'physics', 'chemistry', 'generic'));
