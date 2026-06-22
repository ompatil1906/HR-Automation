ALTER TABLE "UserProfile"
  ADD COLUMN "portfolio" TEXT,
  ADD COLUMN "headline" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "professionalSummary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "experiences" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "educationEntries" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "projects" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "certifications" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "achievements" JSONB NOT NULL DEFAULT '[]';

UPDATE "UserProfile"
SET
  "headline" = 'AI/ML & Full-Stack Engineer',
  "professionalSummary" = "experienceSummary",
  "experiences" = jsonb_build_array(
    jsonb_build_object('id', 'asklumenai', 'company', 'AskLumenAI', 'role', 'Director | Product, Strategy & Technology and Founding AI/ML Engineer', 'employmentType', '', 'location', '', 'startDate', '', 'endDate', '', 'current', true, 'description', "askLumenDescription", 'achievements', '[]'::jsonb, 'technologies', '[]'::jsonb),
    jsonb_build_object('id', 'viksithub', 'company', 'ViksitHub', 'role', 'Full-Stack Engineer Intern', 'employmentType', 'Internship', 'location', '', 'startDate', '', 'endDate', '', 'current', false, 'description', "viksitHubDescription", 'achievements', '[]'::jsonb, 'technologies', '[]'::jsonb),
    jsonb_build_object('id', 'xerxez', 'company', 'XerXez Solutions', 'role', 'Intern', 'employmentType', 'Internship', 'location', '', 'startDate', '', 'endDate', '', 'current', false, 'description', "xerxezDescription", 'achievements', '[]'::jsonb, 'technologies', '[]'::jsonb)
  ),
  "educationEntries" = CASE WHEN COALESCE("education", '') = '' THEN '[]'::jsonb ELSE jsonb_build_array(
    jsonb_build_object('id', 'primary-education', 'institution', '', 'degree', "education", 'field', '', 'location', '', 'startDate', '', 'endDate', '', 'grade', '', 'highlights', '[]'::jsonb)
  ) END
WHERE "professionalSummary" = '';
