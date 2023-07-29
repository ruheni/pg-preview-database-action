-- CreateTable
CREATE TABLE "Database" (
    "id" SERIAL NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "database" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
);
