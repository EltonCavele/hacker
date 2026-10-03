-- CreateEnum
CREATE TYPE "FolhaPaymentDecision" AS ENUM ('PAY', 'HOLD', 'SUSPEND');

-- CreateTable
CREATE TABLE "folha_payroll_batches" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'e-folha',
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "validated_at" TIMESTAMPTZ(6) NOT NULL,
    "line_count" INTEGER NOT NULL,
    "released_count" INTEGER NOT NULL,
    "held_count" INTEGER NOT NULL,

    CONSTRAINT "folha_payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folha_payment_lines" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "decision" "FolhaPaymentDecision" NOT NULL,
    "reason" TEXT NOT NULL,
    "amount_mzn" INTEGER NOT NULL,
    "released" BOOLEAN NOT NULL,

    CONSTRAINT "folha_payment_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folha_payroll_batches_cycle_id_key" ON "folha_payroll_batches"("cycle_id");

-- CreateIndex
CREATE INDEX "folha_payment_lines_employee_id_idx" ON "folha_payment_lines"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "folha_payment_lines_batch_id_employee_id_key" ON "folha_payment_lines"("batch_id", "employee_id");

-- AddForeignKey
ALTER TABLE "folha_payroll_batches" ADD CONSTRAINT "folha_payroll_batches_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "folha_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_payment_lines" ADD CONSTRAINT "folha_payment_lines_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "folha_payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folha_payment_lines" ADD CONSTRAINT "folha_payment_lines_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "folha_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
