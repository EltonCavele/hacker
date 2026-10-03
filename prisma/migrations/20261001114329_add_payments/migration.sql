/*
  Warnings:

  - You are about to drop the column `user_id` on the `payment_purchases` table. All the data in the column will be lost.
  - Added the required column `userId` to the `payment_purchases` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payment_purchases" DROP CONSTRAINT "payment_purchases_user_id_fkey";

-- DropIndex
DROP INDEX "payment_purchases_user_id_created_at_idx";

-- AlterTable
ALTER TABLE "payment_purchases" DROP COLUMN "user_id",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "payment_purchases_userId_created_at_idx" ON "payment_purchases"("userId", "created_at");

-- AddForeignKey
ALTER TABLE "payment_purchases" ADD CONSTRAINT "payment_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
