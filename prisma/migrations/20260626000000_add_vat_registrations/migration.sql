CREATE TABLE `fdo_vat_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NOT NULL,
    `citizenId` INTEGER NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NOT NULL,
    `taxRegime` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `issueDate` DATETIME(3) NULL,
    `issuingAuthority` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `suspensionReason` TEXT NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fdo_vat_registrations_registrationNumber_key`(`registrationNumber`),
    INDEX `fdo_vat_registrations_citizenId_idx`(`citizenId`),
    INDEX `fdo_vat_registrations_registrationNumber_idx`(`registrationNumber`),
    INDEX `fdo_vat_registrations_status_idx`(`status`),
    INDEX `fdo_vat_registrations_officerId_idx`(`officerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fdo_vat_registrations` ADD CONSTRAINT `fdo_vat_registrations_officerId_fkey`
    FOREIGN KEY (`officerId`) REFERENCES `fdo_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
