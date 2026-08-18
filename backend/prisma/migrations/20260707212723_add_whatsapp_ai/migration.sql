-- CreateEnum
CREATE TYPE "WhatsappProvider" AS ENUM ('EVOLUTION');

-- CreateTable
CREATE TABLE "WhatsappConnection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "WhatsappProvider" NOT NULL DEFAULT 'EVOLUTION',
    "instanceName" TEXT,
    "apiUrl" TEXT,
    "apiToken" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'inicio',
    "context" JSONB NOT NULL DEFAULT '{}',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConnection_instanceName_key" ON "WhatsappConnection"("instanceName");

-- CreateIndex
CREATE INDEX "WhatsappConnection_companyId_idx" ON "WhatsappConnection"("companyId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_companyId_idx" ON "WhatsappConversation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_connectionId_phone_key" ON "WhatsappConversation"("connectionId", "phone");

-- CreateIndex
CREATE INDEX "WhatsappMessage_conversationId_createdAt_idx" ON "WhatsappMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsappConnection" ADD CONSTRAINT "WhatsappConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "WhatsappConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
