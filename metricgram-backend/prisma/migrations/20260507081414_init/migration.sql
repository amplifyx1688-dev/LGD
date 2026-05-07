-- CreateEnum
CREATE TYPE "DiceGameStatus" AS ENUM ('waiting', 'betting', 'rolling', 'settling', 'closed');

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isGlobalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "configSchema" JSON,
    "dependencies" JSON NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleConfig" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "groupId" INTEGER,
    "configJson" JSON NOT NULL DEFAULT '{}',
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "totalPointsSpent" INTEGER NOT NULL DEFAULT 0,
    "lastCheckinAt" TIMESTAMP(3),
    "checkinStreak" INTEGER NOT NULL DEFAULT 0,
    "checkinCount" INTEGER NOT NULL DEFAULT 0,
    "balanceUsdt" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "walletAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "telegramChatId" BIGINT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "username" TEXT,
    "ownerUserId" INTEGER NOT NULL,
    "modulesEnabled" JSON NOT NULL DEFAULT '{"boot":true,"activity":false,"broadcast":false,"night":false,"verify":false,"checkin":false,"forward":false,"dice":false,"carousel":false,"clean":false}',
    "diceSettings" JSON NOT NULL DEFAULT '{"commissionRate":0.05,"minBet":1,"maxBet":1000,"gameType":"niuniu"}',
    "carouselSettings" JSON NOT NULL DEFAULT '{"intervalSeconds":5,"startIndex":0,"enabledChannels":["ad","chat","checkin"]}',
    "verifyJoinEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verifyPrivateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verifyChannelEnabled" BOOLEAN NOT NULL DEFAULT false,
    "checkinEnabled" BOOLEAN NOT NULL DEFAULT false,
    "checkinReward" INTEGER NOT NULL DEFAULT 1,
    "carouselEnabled" BOOLEAN NOT NULL DEFAULT false,
    "carouselLastIndex" INTEGER NOT NULL DEFAULT 0,
    "carouselLastSentAt" TIMESTAMP(3),
    "carouselInterval" INTEGER NOT NULL DEFAULT 5,
    "cleanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cleanIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "diceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "telegramMessageId" BIGINT,
    "pointsEarned" INTEGER NOT NULL,
    "streakBefore" INTEGER,
    "streakAfter" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "gameId" INTEGER,
    "referenceId" INTEGER,
    "metadata" JSON NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiceGame" (
    "id" SERIAL NOT NULL,
    "roomId" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "gameType" TEXT NOT NULL DEFAULT 'niuniu',
    "betMode" TEXT NOT NULL DEFAULT 'normal',
    "minBetUsdt" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "maxBetUsdt" DECIMAL(10,4),
    "hostUserId" INTEGER NOT NULL,
    "hostBetUsdt" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "hostDiceJson" JSON NOT NULL,
    "hostResult" JSONB,
    "hostPayoutMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "status" "DiceGameStatus" NOT NULL DEFAULT 'waiting',
    "startedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiceGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiceParticipant" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "betUsdt" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "betMultiplier" INTEGER NOT NULL DEFAULT 1,
    "playerDiceJson" JSON,
    "playerResult" JSONB,
    "payoutUsdt" DECIMAL(10,4),
    "result" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiceParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "balanceUsdt" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "walletAddress" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "balanceBefore" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "gameId" INTEGER,
    "txHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselContent" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER,
    "module" TEXT NOT NULL DEFAULT 'carousel',
    "contentType" TEXT NOT NULL,
    "contentKey" TEXT NOT NULL,
    "contentJson" JSON NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'timer',
    "triggerConfig" JSON DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ButtonHandler" (
    "id" SERIAL NOT NULL,
    "handlerKey" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "paramSchema" JSON,
    "requiredPoints" INTEGER NOT NULL DEFAULT 0,
    "requiredBalance" DECIMAL(10,4),
    "rateLimitCount" INTEGER NOT NULL DEFAULT 1,
    "rateLimitSeconds" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ButtonHandler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" SERIAL NOT NULL,
    "taskName" TEXT NOT NULL,
    "cronExpression" TEXT,
    "taskType" TEXT NOT NULL,
    "taskConfig" JSON NOT NULL DEFAULT '{}',
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunError" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxConcurrentRuns" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "action" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSON NOT NULL DEFAULT '{}',
    "userId" INTEGER,
    "groupId" INTEGER,
    "telegramChatId" BIGINT,
    "telegramMessageId" BIGINT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSetting" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER,
    "settingsKey" TEXT NOT NULL,
    "settingsValue" JSON NOT NULL DEFAULT '{}',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastQueue" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER,
    "messageType" TEXT NOT NULL,
    "contentJson" JSON NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "timeWindowStart" TEXT,
    "timeWindowEnd" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelSpin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeAmount" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WheelSpin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GroupToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE INDEX "ModuleConfig_groupId_idx" ON "ModuleConfig"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleConfig_moduleId_groupId_key" ON "ModuleConfig"("moduleId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_telegramChatId_key" ON "Group"("telegramChatId");

-- CreateIndex
CREATE INDEX "Checkin_userId_idx" ON "Checkin"("userId");

-- CreateIndex
CREATE INDEX "Checkin_groupId_idx" ON "Checkin"("groupId");

-- CreateIndex
CREATE INDEX "Checkin_checkedAt_idx" ON "Checkin"("checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Checkin_userId_checkedAt_key" ON "Checkin"("userId", "checkedAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_createdAt_idx" ON "PointsTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DiceGame_roomId_key" ON "DiceGame"("roomId");

-- CreateIndex
CREATE INDEX "DiceGame_groupId_idx" ON "DiceGame"("groupId");

-- CreateIndex
CREATE INDEX "DiceGame_status_idx" ON "DiceGame"("status");

-- CreateIndex
CREATE INDEX "DiceGame_roomId_idx" ON "DiceGame"("roomId");

-- CreateIndex
CREATE INDEX "DiceParticipant_userId_idx" ON "DiceParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiceParticipant_gameId_userId_key" ON "DiceParticipant"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "UserWallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "CarouselContent_contentKey_idx" ON "CarouselContent"("contentKey");

-- CreateIndex
CREATE INDEX "CarouselContent_isActive_idx" ON "CarouselContent"("isActive");

-- CreateIndex
CREATE INDEX "CarouselContent_sortOrder_idx" ON "CarouselContent"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CarouselContent_groupId_contentKey_key" ON "CarouselContent"("groupId", "contentKey");

-- CreateIndex
CREATE UNIQUE INDEX "ButtonHandler_handlerKey_key" ON "ButtonHandler"("handlerKey");

-- CreateIndex
CREATE INDEX "ButtonHandler_module_idx" ON "ButtonHandler"("module");

-- CreateIndex
CREATE INDEX "ButtonHandler_handlerKey_idx" ON "ButtonHandler"("handlerKey");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTask_taskName_key" ON "ScheduledTask"("taskName");

-- CreateIndex
CREATE INDEX "SystemLog_module_idx" ON "SystemLog"("module");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");

-- CreateIndex
CREATE INDEX "GameSetting_settingsKey_idx" ON "GameSetting"("settingsKey");

-- CreateIndex
CREATE UNIQUE INDEX "GameSetting_groupId_settingsKey_key" ON "GameSetting"("groupId", "settingsKey");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "_GroupToUser"("B");

-- AddForeignKey
ALTER TABLE "ModuleConfig" ADD CONSTRAINT "ModuleConfig_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleConfig" ADD CONSTRAINT "ModuleConfig_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "DiceGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceGame" ADD CONSTRAINT "DiceGame_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceGame" ADD CONSTRAINT "DiceGame_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceParticipant" ADD CONSTRAINT "DiceParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "DiceGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiceParticipant" ADD CONSTRAINT "DiceParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "DiceGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselContent" ADD CONSTRAINT "CarouselContent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
