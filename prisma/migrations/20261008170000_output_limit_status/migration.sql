-- A program that writes past the output ceiling is its own verdict, not a
-- runtime error: the fix (print less, or stop looping) is different.
ALTER TYPE "SubmissionStatus" ADD VALUE 'OUTPUT_LIMIT_EXCEEDED';
