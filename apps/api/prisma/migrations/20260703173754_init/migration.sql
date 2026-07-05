-- CreateEnum
CREATE TYPE "Role" AS ENUM ('buyer', 'seller', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organization" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "corridorId" TEXT NOT NULL,
    "productClass" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "priceVersion" INTEGER NOT NULL DEFAULT 1,
    "priceUpdatedAt" TIMESTAMP(3) NOT NULL,
    "procurementFrequency" TEXT NOT NULL,
    "availableQty" TEXT NOT NULL,
    "specs" TEXT[],
    "certifications" TEXT[],
    "decisionFactors" TEXT[],
    "note" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_revisions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "previousPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lots" INTEGER NOT NULL,
    "freightTier" TEXT NOT NULL,
    "moverTier" TEXT NOT NULL,
    "fulfilment" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totals" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "rulePackVersion" INTEGER NOT NULL,
    "priceVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "lots" INTEGER NOT NULL,
    "fulfilment" TEXT NOT NULL,
    "freightTier" TEXT NOT NULL,
    "moverTier" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totals" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "corridorLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_sales" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerAlias" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "lots" INTEGER NOT NULL,
    "quantityTons" DOUBLE PRECISION NOT NULL,
    "amount" INTEGER NOT NULL,
    "fulfilment" TEXT NOT NULL,
    "qualityStatus" TEXT NOT NULL,
    "disputeCount" INTEGER NOT NULL,

    CONSTRAINT "seller_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_partners" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "corridor" TEXT NOT NULL,
    "baseRatePerTon" INTEGER NOT NULL,
    "distanceRatePerTonKm" DOUBLE PRECISION NOT NULL,
    "capacity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastAudit" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "products_sellerId_idx" ON "products"("sellerId");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_state_idx" ON "products"("state");

-- CreateIndex
CREATE INDEX "price_revisions_sellerId_effectiveAt_idx" ON "price_revisions"("sellerId", "effectiveAt" DESC);

-- CreateIndex
CREATE INDEX "price_revisions_productId_idx" ON "price_revisions"("productId");

-- CreateIndex
CREATE INDEX "quotes_buyerId_createdAt_idx" ON "quotes"("buyerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "quotes_productId_status_idx" ON "quotes"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_quoteId_key" ON "orders"("quoteId");

-- CreateIndex
CREATE INDEX "orders_buyerId_createdAt_idx" ON "orders"("buyerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_sellerId_createdAt_idx" ON "orders"("sellerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "seller_sales_sellerId_soldAt_idx" ON "seller_sales"("sellerId", "soldAt" DESC);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_revisions" ADD CONSTRAINT "price_revisions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_sales" ADD CONSTRAINT "seller_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
