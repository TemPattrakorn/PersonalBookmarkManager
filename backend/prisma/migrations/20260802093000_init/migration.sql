-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auth0Subject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "collectionId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bookmark_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "granteePersonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionShare_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionShare_granteePersonId_fkey" FOREIGN KEY ("granteePersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_auth0Subject_key" ON "Person"("auth0Subject");

-- CreateIndex
CREATE INDEX "Person_normalizedEmail_emailVerified_idx" ON "Person"("normalizedEmail", "emailVerified");

-- CreateIndex
CREATE INDEX "Collection_ownerId_createdAt_id_idx" ON "Collection"("ownerId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Bookmark_ownerId_createdAt_id_idx" ON "Bookmark"("ownerId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Bookmark_collectionId_createdAt_id_idx" ON "Bookmark"("collectionId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "CollectionShare_granteePersonId_createdAt_id_idx" ON "CollectionShare"("granteePersonId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "CollectionShare_collectionId_createdAt_id_idx" ON "CollectionShare"("collectionId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionShare_collectionId_granteePersonId_key" ON "CollectionShare"("collectionId", "granteePersonId");
