-- AlterTable
ALTER TABLE "CodMessageSettings" ADD COLUMN "confirmedHeading" TEXT NOT NULL DEFAULT 'Order Confirmed';
ALTER TABLE "CodMessageSettings" ADD COLUMN "confirmedBadgeText" TEXT NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE "CodMessageSettings" ADD COLUMN "confirmedBodyText" TEXT NOT NULL DEFAULT 'Your COD order has been confirmed via WhatsApp.';
ALTER TABLE "CodMessageSettings" ADD COLUMN "confirmedWarningText" TEXT NOT NULL DEFAULT 'Thank you for confirming your order.';
ALTER TABLE "CodMessageSettings" ADD COLUMN "cancelledHeading" TEXT NOT NULL DEFAULT 'Order Cancelled';
ALTER TABLE "CodMessageSettings" ADD COLUMN "cancelledBadgeText" TEXT NOT NULL DEFAULT 'CANCELLED';
ALTER TABLE "CodMessageSettings" ADD COLUMN "cancelledBodyText" TEXT NOT NULL DEFAULT 'Your COD order has been cancelled via WhatsApp.';
ALTER TABLE "CodMessageSettings" ADD COLUMN "cancelledWarningText" TEXT NOT NULL DEFAULT 'If this was a mistake, please contact support.';
