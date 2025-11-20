-- CreateTable
CREATE TABLE `fdo_users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `surname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `badge` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `rank` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fdo_users_email_key`(`email`),
    UNIQUE INDEX `fdo_users_badge_key`(`badge`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(191) NULL,
    `firstname` VARCHAR(191) NULL,
    `lastname` VARCHAR(191) NULL,
    `dateofbirth` VARCHAR(191) NULL,
    `sex` VARCHAR(191) NULL,
    `height` INTEGER NULL,
    `phone_number` VARCHAR(191) NULL,
    `accounts` LONGTEXT NULL,
    `group` VARCHAR(50) NULL DEFAULT 'user',
    `inventory` LONGTEXT NULL,
    `job` VARCHAR(20) NULL DEFAULT 'unemployed',
    `job_grade` INTEGER NULL DEFAULT 0,
    `loadout` LONGTEXT NULL,
    `metadata` LONGTEXT NULL,
    `position` LONGTEXT NULL,
    `status` LONGTEXT NULL,
    `nationality` VARCHAR(111) NULL,
    `skin` LONGTEXT NULL,
    `bankingData` LONGTEXT NULL,
    `job2` VARCHAR(50) NULL DEFAULT 'unemployed',
    `job2_grade` INTEGER NULL DEFAULT 0,
    `immProfilo` LONGTEXT NULL,
    `tattoos` LONGTEXT NULL,
    `badge` INTEGER NULL,
    `jail` INTEGER NULL DEFAULT 0,
    `is_dead` BOOLEAN NULL DEFAULT false,
    `last_updated` DATETIME(3) NULL,

    UNIQUE INDEX `users_identifier_key`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_api_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `lastUsed` DATETIME(3) NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `fdo_api_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `fdo_accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fdo_sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fdo_verification_tokens_token_key`(`token`),
    UNIQUE INDEX `fdo_verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_arrests` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `charges` VARCHAR(191) NOT NULL,
    `sentence` VARCHAR(191) NULL,
    `fine` INTEGER NULL,
    `citizenId` INTEGER NOT NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `incidentDescription` VARCHAR(191) NULL,
    `seizedItems` VARCHAR(191) NULL,
    `department` VARCHAR(191) NOT NULL,
    `signingOfficers` JSON NULL,
    `accomplices` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_reports` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `officerId` VARCHAR(191) NOT NULL,
    `citizenId` INTEGER NULL,
    `accusedId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fdo_wanted` (
    `id` VARCHAR(191) NOT NULL,
    `citizenId` INTEGER NOT NULL,
    `crimes` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `lastSeen` VARCHAR(191) NULL,
    `dangerLevel` VARCHAR(191) NOT NULL,
    `bounty` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `insertedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fdo_wanted_citizenId_idx`(`citizenId`),
    INDEX `fdo_wanted_officerId_idx`(`officerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fdo_api_tokens` ADD CONSTRAINT `fdo_api_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `fdo_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_accounts` ADD CONSTRAINT `fdo_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `fdo_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_sessions` ADD CONSTRAINT `fdo_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `fdo_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_arrests` ADD CONSTRAINT `fdo_arrests_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_arrests` ADD CONSTRAINT `fdo_arrests_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `fdo_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_reports` ADD CONSTRAINT `fdo_reports_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `fdo_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_reports` ADD CONSTRAINT `fdo_reports_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_reports` ADD CONSTRAINT `fdo_reports_accusedId_fkey` FOREIGN KEY (`accusedId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_wanted` ADD CONSTRAINT `fdo_wanted_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fdo_wanted` ADD CONSTRAINT `fdo_wanted_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `fdo_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
