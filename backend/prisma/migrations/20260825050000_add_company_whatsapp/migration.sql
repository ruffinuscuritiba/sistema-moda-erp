-- AlterTable (idempotente — seguro rodar mesmo se já aplicada)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
