ALTER TABLE "coding_problem_test_case_set" ADD COLUMN IF NOT EXISTS "expected_outputs" jsonb DEFAULT '[]'::jsonb NOT NULL;
