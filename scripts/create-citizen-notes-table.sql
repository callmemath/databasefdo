-- Migrazione per creare la tabella delle note dei cittadini
-- Eseguire questo script nel database fdo_database

CREATE TABLE IF NOT EXISTS `fdo_citizen_notes` (
  `id` VARCHAR(191) NOT NULL,
  `citizenId` INT NOT NULL,
  `content` TEXT NOT NULL,
  `createdBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fdo_citizen_notes_citizenId_idx` (`citizenId`),
  INDEX `fdo_citizen_notes_createdBy_idx` (`createdBy`),
  CONSTRAINT `fdo_citizen_notes_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `fdo_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
