-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('CAPTAIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'PLAYED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "captains" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "captainId" UUID NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "inviteActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "role" "MemberRole" NOT NULL DEFAULT 'PLAYER',
    "nickname" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "opponent" TEXT,
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "confirmDeadline" TIMESTAMP(3) NOT NULL,
    "slots" INTEGER,
    "notes" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "captains_email_key" ON "captains"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_inviteCode_key" ON "teams"("inviteCode");

-- CreateIndex
CREATE INDEX "teams_captainId_idx" ON "teams"("captainId");

-- CreateIndex
CREATE UNIQUE INDEX "players_phone_key" ON "players"("phone");

-- CreateIndex
CREATE INDEX "team_members_teamId_status_idx" ON "team_members"("teamId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_playerId_key" ON "team_members"("teamId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_publicId_key" ON "matches"("publicId");

-- CreateIndex
CREATE INDEX "matches_teamId_kickoffAt_idx" ON "matches"("teamId", "kickoffAt");

-- CreateIndex
CREATE INDEX "attendances_matchId_status_idx" ON "attendances"("matchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_matchId_teamMemberId_key" ON "attendances"("matchId", "teamMemberId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "captains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
