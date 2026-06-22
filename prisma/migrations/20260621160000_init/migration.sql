CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'PAUSED', 'COMPLETED', 'FAILED');
CREATE TYPE "ContactStatus" AS ENUM ('IMPORTED', 'RESEARCHING', 'RESEARCHED', 'GENERATING', 'GENERATED', 'APPROVED', 'DRAFTED', 'SENT', 'MANUAL_REVIEW', 'SKIPPED', 'FAILED');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'CREATED', 'SENT', 'FAILED');

CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT,
  "linkedin" TEXT, "github" TEXT, "location" TEXT, "education" TEXT,
  "targetRoles" JSONB NOT NULL, "skills" JSONB NOT NULL, "experienceSummary" TEXT NOT NULL,
  "askLumenDescription" TEXT NOT NULL, "viksitHubDescription" TEXT NOT NULL,
  "xerxezDescription" TEXT NOT NULL, "defaultSignature" TEXT NOT NULL,
  "defaultResumeStrategy" TEXT NOT NULL DEFAULT 'category', "dailySendLimit" INTEGER NOT NULL DEFAULT 20,
  "sendDelaySeconds" INTEGER NOT NULL DEFAULT 30, "draftOnlyMode" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "encryptedKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OAuthCredential" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "encryptedTokens" TEXT NOT NULL, "accountEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OAuthCredential_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ResumeTemplate" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "originalLatex" TEXT NOT NULL,
  "currentLatex" TEXT NOT NULL, "originalPdfUrl" TEXT, "pdfUrl" TEXT, "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResumeTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "uploadedFileUrl" TEXT, "uploadedFileName" TEXT,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT', "totalRows" INTEGER NOT NULL DEFAULT 0, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompanyResearch" (
  "id" TEXT NOT NULL, "companyName" TEXT NOT NULL, "normalizedCompanyName" TEXT NOT NULL,
  "officialWebsite" TEXT, "linkedinUrl" TEXT, "industry" TEXT, "companyType" TEXT, "category" TEXT NOT NULL,
  "productsServices" TEXT NOT NULL, "techFocus" TEXT NOT NULL, "companyBackground" TEXT NOT NULL,
  "whyRelevantToOm" TEXT NOT NULL, "possibleRoles" JSONB NOT NULL, "recommendedResumeAngle" TEXT NOT NULL,
  "personalizationPoints" JSONB NOT NULL, "confidenceScore" INTEGER NOT NULL,
  "manualReviewRequired" BOOLEAN NOT NULL, "sources" JSONB NOT NULL, "hiringSignals" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyResearch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Contact" (
  "id" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "researchId" TEXT, "hrName" TEXT,
  "hrEmail" TEXT NOT NULL, "companyName" TEXT NOT NULL, "originalCompanyName" TEXT NOT NULL,
  "companyWebsite" TEXT, "linkedinUrl" TEXT, "notes" TEXT, "emailValid" BOOLEAN NOT NULL,
  "status" "ContactStatus" NOT NULL DEFAULT 'IMPORTED', "priorityScore" INTEGER NOT NULL DEFAULT 0,
  "hiringLikelihood" TEXT NOT NULL DEFAULT 'Very Low', "manualReviewResolved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GeneratedResume" (
  "id" TEXT NOT NULL, "contactId" TEXT NOT NULL, "templateId" TEXT, "companyName" TEXT NOT NULL,
  "resumeType" TEXT NOT NULL, "latexContent" TEXT NOT NULL, "htmlContent" TEXT, "texFileUrl" TEXT,
  "pdfFileUrl" TEXT, "fileName" TEXT NOT NULL, "compileStatus" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT, "contentHash" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "GeneratedResume_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GeneratedEmail" (
  "id" TEXT NOT NULL, "contactId" TEXT NOT NULL, "subject" TEXT NOT NULL, "body" TEXT NOT NULL,
  "followUpBody" TEXT NOT NULL, "personalizationLine" TEXT NOT NULL, "targetRole" TEXT NOT NULL,
  "confidenceScore" INTEGER NOT NULL, "manualReviewRequired" BOOLEAN NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false, "approvedAt" TIMESTAMP(3), "editedByUser" BOOLEAN NOT NULL DEFAULT false,
  "qualityCheck" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GeneratedEmail_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GmailDraft" (
  "id" TEXT NOT NULL, "contactId" TEXT NOT NULL, "generatedEmailId" TEXT NOT NULL, "gmailDraftId" TEXT,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING', "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GmailDraft_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SentEmail" (
  "id" TEXT NOT NULL, "contactId" TEXT NOT NULL, "generatedEmailId" TEXT NOT NULL, "gmailMessageId" TEXT,
  "sentAt" TIMESTAMP(3), "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING', "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SentEmail_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT,
  "campaignId" TEXT, "contactId" TEXT, "companyName" TEXT, "hrEmail" TEXT, "status" TEXT NOT NULL,
  "message" TEXT NOT NULL, "userAction" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BackgroundJob" (
  "id" TEXT NOT NULL, "type" TEXT NOT NULL, "contactId" TEXT, "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0, "payload" JSONB NOT NULL, "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");
CREATE UNIQUE INDEX "ApiKey_provider_key" ON "ApiKey"("provider");
CREATE UNIQUE INDEX "OAuthCredential_provider_key" ON "OAuthCredential"("provider");
CREATE INDEX "Contact_campaignId_status_idx" ON "Contact"("campaignId", "status");
CREATE INDEX "Contact_companyName_idx" ON "Contact"("companyName");
CREATE INDEX "CompanyResearch_normalizedCompanyName_idx" ON "CompanyResearch"("normalizedCompanyName");
CREATE INDEX "GeneratedResume_contactId_createdAt_idx" ON "GeneratedResume"("contactId", "createdAt");
CREATE INDEX "GeneratedEmail_contactId_createdAt_idx" ON "GeneratedEmail"("contactId", "createdAt");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "BackgroundJob_status_createdAt_idx" ON "BackgroundJob"("status", "createdAt");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "CompanyResearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedResume" ADD CONSTRAINT "GeneratedResume_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedResume" ADD CONSTRAINT "GeneratedResume_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ResumeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedEmail" ADD CONSTRAINT "GeneratedEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GmailDraft" ADD CONSTRAINT "GmailDraft_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GmailDraft" ADD CONSTRAINT "GmailDraft_generatedEmailId_fkey" FOREIGN KEY ("generatedEmailId") REFERENCES "GeneratedEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SentEmail" ADD CONSTRAINT "SentEmail_generatedEmailId_fkey" FOREIGN KEY ("generatedEmailId") REFERENCES "GeneratedEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BackgroundJob" ADD CONSTRAINT "BackgroundJob_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
