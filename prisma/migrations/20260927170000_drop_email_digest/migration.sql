-- Drop the weekly-email preference.
--
-- It was a toggle for a feature that does not exist: no mailer is
-- configured, nothing ever read the column, and the settings page promised
-- a "weekly progress email" that could never arrive. The replacement is
-- three in-app notification preferences that gate notifications the product
-- actually produces.

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "emailDigest";
