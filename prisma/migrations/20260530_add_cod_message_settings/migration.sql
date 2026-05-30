-- CreateTable
CREATE TABLE "CodMessageSettings" (
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "heading" TEXT NOT NULL DEFAULT 'COD Confirmation Required',
    "badgeText" TEXT NOT NULL DEFAULT 'ACTION NEEDED',
    "bodyText" TEXT NOT NULL DEFAULT 'Please confirm your COD order on WhatsApp. We''ve sent you a confirmation message.',
    "warningText" TEXT NOT NULL DEFAULT 'Without confirmation, your order will not be shipped.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodMessageSettings_pkey" PRIMARY KEY ("shop")
);
