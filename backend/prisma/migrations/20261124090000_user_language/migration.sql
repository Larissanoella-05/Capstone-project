-- The language of a person's notifications: en (English) or rw (Kinyarwanda).
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
