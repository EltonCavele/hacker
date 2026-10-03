-- CreateEnum
CREATE TYPE "FolhaSector" AS ENUM ('EDUCATION', 'HEALTH', 'DISTRICT_ADMIN', 'POLICE', 'CENTRAL');

-- CreateEnum
CREATE TYPE "FolhaEmployeeStatus" AS ENUM ('ACTIVE', 'IN_TRANSIT', 'DISPLACED', 'ON_LEAVE', 'LEFT', 'DECEASED', 'NO_UNIT', 'ADMISSION_PENDING');

-- CreateEnum
CREATE TYPE "FolhaAttestationMark" AS ENUM ('PRESENT', 'ABSENT_JUSTIFIED', 'ON_LEAVE', 'TRANSFERRED', 'LEFT', 'DECEASED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FolhaAnomalyType" AS ENUM ('SHARED_ACCOUNT', 'ACCOUNT_HOLDER_MISMATCH', 'DUPLICATE_FACE', 'DUPLICATE_NUIT', 'DUPLICATE_ID', 'SALARY_AND_PENSION', 'OVER_RETIREMENT_AGE', 'NO_UNIT', 'NO_CHIEF', 'GROWTH_WITHOUT_ADMISSION', 'UNUSUAL_OPERATOR');

-- CreateEnum
CREATE TYPE "FolhaRisk" AS ENUM ('HIGH', 'MEDIUM');

-- CreateEnum
CREATE TYPE "FolhaDrawPhotoResult" AS ENUM ('MATCH', 'NO_SHOW', 'LOCATION_FAIL', 'NOT_A_LIVE_FACE');

-- CreateEnum
CREATE TYPE "FolhaMovementType" AS ENUM ('ADMISSION', 'TRANSFER', 'RETIREMENT', 'DEATH', 'ABANDONMENT');

-- CreateEnum
CREATE TYPE "FolhaContestStatus" AS ENUM ('OPEN', 'VERIFIED_GENUINE', 'VERIFIED_GHOST');

-- CreateEnum
CREATE TYPE "FolhaCaseType" AS ENUM ('DISCIPLINARY', 'VOLUNTARY_RETURN');

-- CreateEnum
CREATE TYPE "FolhaCaseStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "folha_cycles" (
    "id" UUID NOT NULL,
    "year_month" TEXT NOT NULL,
    "opens_at" TIMESTAMPTZ(6) NOT NULL,
    "closes_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_units" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sector" "FolhaSector" NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "ugb" TEXT NOT NULL,
    "parent_id" UUID,
    "chief_employee_id" UUID,
    "deputy_employee_id" UUID,
    "offline_zone" BOOLEAN NOT NULL DEFAULT false,
    "conflict_zone" BOOLEAN NOT NULL DEFAULT false,
    "device_wiped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_employees" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nuit" TEXT NOT NULL,
    "identity_card" TEXT NOT NULL,
    "born_at" DATE NOT NULL,
    "face_token" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "salary_mzn" INTEGER NOT NULL,
    "status" "FolhaEmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "receives_pension" BOOLEAN NOT NULL DEFAULT false,
    "operator_id" TEXT NOT NULL,
    "created_without_process" BOOLEAN NOT NULL DEFAULT false,
    "unit_id" UUID,
    "transit_started_at" TIMESTAMPTZ(6),
    "leave_ends_at" TIMESTAMPTZ(6),
    "unclaimed_since" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_attestations" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "mark" "FolhaAttestationMark" NOT NULL,
    "justification" TEXT,
    "created_offline" BOOLEAN NOT NULL DEFAULT false,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "warned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_anomalies" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "type" "FolhaAnomalyType" NOT NULL,
    "risk" "FolhaRisk" NOT NULL,
    "employee_id" UUID,
    "unit_id" UUID,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_draws" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "photoResult" "FolhaDrawPhotoResult",
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_audits" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "attestedAs" "FolhaAttestationMark",
    "found_present" BOOLEAN NOT NULL,
    "visited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_movements" (
    "id" UUID NOT NULL,
    "type" "FolhaMovementType" NOT NULL,
    "employee_id" UUID NOT NULL,
    "from_unit_id" UUID,
    "to_unit_id" UUID,
    "created_by" TEXT NOT NULL,
    "accepted_by" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_contests" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "FolhaContestStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "reactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_cases" (
    "id" UUID NOT NULL,
    "type" "FolhaCaseType" NOT NULL,
    "status" "FolhaCaseStatus" NOT NULL DEFAULT 'OPEN',
    "employee_id" UUID NOT NULL,
    "detail" TEXT NOT NULL,
    "amount_recovered" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folha_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folha_cycles_year_month_key" ON "folha_cycles"("year_month");

-- CreateIndex
CREATE UNIQUE INDEX "folha_units_chief_employee_id_key" ON "folha_units"("chief_employee_id");

-- CreateIndex
CREATE INDEX "folha_units_district_idx" ON "folha_units"("district");

-- CreateIndex
CREATE INDEX "folha_employees_nuit_idx" ON "folha_employees"("nuit");

-- CreateIndex
CREATE INDEX "folha_employees_identity_card_idx" ON "folha_employees"("identity_card");

-- CreateIndex
CREATE INDEX "folha_employees_face_token_idx" ON "folha_employees"("face_token");

-- CreateIndex
CREATE INDEX "folha_employees_account_number_idx" ON "folha_employees"("account_number");

-- CreateIndex
CREATE INDEX "folha_employees_unit_id_idx" ON "folha_employees"("unit_id");

-- CreateIndex
CREATE INDEX "folha_attestations_unit_id_cycle_id_idx" ON "folha_attestations"("unit_id", "cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "folha_attestations_cycle_id_employee_id_key" ON "folha_attestations"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "folha_anomalies_cycle_id_risk_idx" ON "folha_anomalies"("cycle_id", "risk");

-- CreateIndex
CREATE INDEX "folha_draws_unit_id_cycle_id_idx" ON "folha_draws"("unit_id", "cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "folha_draws_cycle_id_employee_id_key" ON "folha_draws"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "folha_audits_unit_id_cycle_id_idx" ON "folha_audits"("unit_id", "cycle_id");

-- CreateIndex
CREATE INDEX "folha_movements_employee_id_occurred_at_idx" ON "folha_movements"("employee_id", "occurred_at");

-- CreateIndex
CREATE INDEX "folha_contests_employee_id_cycle_id_idx" ON "folha_contests"("employee_id", "cycle_id");

-- CreateIndex
CREATE INDEX "folha_cases_status_idx" ON "folha_cases"("status");

-- AddForeignKey
ALTER TABLE "folha_units" ADD CONSTRAINT "folha_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folha_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_units" ADD CONSTRAINT "folha_units_chief_employee_id_fkey" FOREIGN KEY ("chief_employee_id") REFERENCES "folha_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_units" ADD CONSTRAINT "folha_units_deputy_employee_id_fkey" FOREIGN KEY ("deputy_employee_id") REFERENCES "folha_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_employees" ADD CONSTRAINT "folha_employees_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "folha_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_attestations" ADD CONSTRAINT "folha_attestations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_attestations" ADD CONSTRAINT "folha_attestations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "folha_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_attestations" ADD CONSTRAINT "folha_attestations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_anomalies" ADD CONSTRAINT "folha_anomalies_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_anomalies" ADD CONSTRAINT "folha_anomalies_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_anomalies" ADD CONSTRAINT "folha_anomalies_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "folha_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_draws" ADD CONSTRAINT "folha_draws_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_draws" ADD CONSTRAINT "folha_draws_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "folha_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_draws" ADD CONSTRAINT "folha_draws_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_audits" ADD CONSTRAINT "folha_audits_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_audits" ADD CONSTRAINT "folha_audits_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "folha_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_audits" ADD CONSTRAINT "folha_audits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_movements" ADD CONSTRAINT "folha_movements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_movements" ADD CONSTRAINT "folha_movements_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "folha_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_movements" ADD CONSTRAINT "folha_movements_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "folha_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_contests" ADD CONSTRAINT "folha_contests_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_contests" ADD CONSTRAINT "folha_contests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_cases" ADD CONSTRAINT "folha_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
