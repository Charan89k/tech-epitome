-- The application connects as the owner, so it is unaffected. With no policy,
-- any other role, such as a data API, sees nothing in these tables.
ALTER TABLE "daily_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contest_problems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contest_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aptitude_attempts" ENABLE ROW LEVEL SECURITY;
