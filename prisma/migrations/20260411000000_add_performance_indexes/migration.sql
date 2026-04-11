-- Performance indexes for multi-tenant queries and dashboard analytics

-- Campaign: lookups por empresa e por status são frequentes em dashboards
CREATE INDEX IF NOT EXISTS "Campaign_companyId_idx" ON "Campaign"("companyId");
CREATE INDEX IF NOT EXISTS "Campaign_companyId_status_idx" ON "Campaign"("companyId", "status");

-- User: lookups por empresa em multi-tenant
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");

-- Response: filtros compostos do dashboard (sector, createdAt, riskLevel)
CREATE INDEX IF NOT EXISTS "Response_campaignId_sector_idx" ON "Response"("campaignId", "sector");
CREATE INDEX IF NOT EXISTS "Response_campaignId_createdAt_idx" ON "Response"("campaignId", "createdAt");
CREATE INDEX IF NOT EXISTS "Response_campaignId_riskLevel_idx" ON "Response"("campaignId", "riskLevel");

-- CampaignInvite: lookups por campanha e por usuário
CREATE INDEX IF NOT EXISTS "CampaignInvite_campaignId_idx" ON "CampaignInvite"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignInvite_userId_idx" ON "CampaignInvite"("userId");
