-- CreateEnum
CREATE TYPE "ConsultantGlobalRole" AS ENUM ('OWNER', 'CONSULTANT', 'ANALYST');

-- AlterTable
ALTER TABLE "Consultant"
ADD COLUMN "globalRole" "ConsultantGlobalRole" NOT NULL DEFAULT 'CONSULTANT';
