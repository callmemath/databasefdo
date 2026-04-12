-- Ensure fdo_weapon_licenses exists (safe for already-provisioned DBs)
CREATE TABLE IF NOT EXISTS `fdo_weapon_licenses` (
    `id` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `citizenId` INTEGER NOT NULL,
    `licenseType` VARCHAR(191) NOT NULL,
    `issueDate` DATETIME(3) NOT NULL,
    `expiryDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `issuingAuthority` VARCHAR(191) NOT NULL,
    `restrictions` TEXT NULL,
    `authorizedWeapons` JSON NULL,
    `notes` TEXT NULL,
    `suspensionReason` TEXT NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fdo_weapon_licenses_licenseNumber_key`(`licenseNumber`),
    INDEX `fdo_weapon_licenses_citizenId_idx`(`citizenId`),
    INDEX `fdo_weapon_licenses_licenseNumber_idx`(`licenseNumber`),
    INDEX `fdo_weapon_licenses_status_idx`(`status`),
    INDEX `fdo_weapon_licenses_officerId_idx`(`officerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Make sure the FK exists (ignore if already present)
SET @fk_exists := (
        SELECT COUNT(*)
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'fdo_weapon_licenses'
            AND COLUMN_NAME = 'officerId'
            AND REFERENCED_TABLE_NAME = 'fdo_users'
            AND REFERENCED_COLUMN_NAME = 'id'
);

SET @fk_sql := IF(
    @fk_exists = 0,
    'ALTER TABLE `fdo_weapon_licenses` ADD CONSTRAINT `fdo_weapon_licenses_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `fdo_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt_fk FROM @fk_sql;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- Ensure fdo_tablet_user_links exists and is managed by Prisma schema
CREATE TABLE IF NOT EXISTS `fdo_tablet_user_links` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `license` VARCHAR(191) NULL,
    `discord` VARCHAR(191) NULL,
    `steam` VARCHAR(191) NULL,
    `fivem` VARCHAR(191) NULL,
    `firstLinkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLoginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastCharacterName` VARCHAR(191) NULL,

    UNIQUE INDEX `fdo_tablet_user_links_userId_key`(`userId`),
    UNIQUE INDEX `fdo_tablet_user_links_license_key`(`license`),
    UNIQUE INDEX `fdo_tablet_user_links_discord_key`(`discord`),
    UNIQUE INDEX `fdo_tablet_user_links_steam_key`(`steam`),
    UNIQUE INDEX `fdo_tablet_user_links_fivem_key`(`fivem`),
    INDEX `fdo_tablet_user_links_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Make sure the FK exists (ignore if already present)
SET @link_fk_exists := (
        SELECT COUNT(*)
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'fdo_tablet_user_links'
            AND COLUMN_NAME = 'userId'
            AND REFERENCED_TABLE_NAME = 'fdo_users'
            AND REFERENCED_COLUMN_NAME = 'id'
);

SET @link_fk_sql := IF(
    @link_fk_exists = 0,
    'ALTER TABLE `fdo_tablet_user_links` ADD CONSTRAINT `fdo_tablet_user_links_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `fdo_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt_link_fk FROM @link_fk_sql;
EXECUTE stmt_link_fk;
DEALLOCATE PREPARE stmt_link_fk;
