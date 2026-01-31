-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Category table
CREATE TABLE "Category" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "externalId" INTEGER NOT NULL UNIQUE,
    "code" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameEnglish" VARCHAR(255) NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- Create Product table
CREATE TABLE "Product" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "externalId" INTEGER NOT NULL UNIQUE,
    "code" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nameEnglish" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(255),
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- Create Store table
CREATE TABLE "Store" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "externalId" INTEGER NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "nameEnglish" VARCHAR(255),
    "chain" VARCHAR(255),
    "location" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Store_chain_idx" ON "Store"("chain");

-- Create Price table
CREATE TABLE "Price" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "price" DECIMAL(10, 2) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Price_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Price_productId_scrapedAt_idx" ON "Price"("productId", "scrapedAt");
CREATE INDEX "Price_storeId_scrapedAt_idx" ON "Price"("storeId", "scrapedAt");
CREATE INDEX "Price_scrapedAt_idx" ON "Price"("scrapedAt");
