-- AlterTable: make issueDate and expiryDate nullable, change default status to pending
ALTER TABLE `fdo_weapon_licenses`
  MODIFY `issueDate` DATETIME(3) NULL,
  MODIFY `expiryDate` DATETIME(3) NULL,
  MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';
