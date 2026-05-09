-- AlterTable: aggiunge discordId come stringa VARCHAR(25) unica e nullable
ALTER TABLE `fdo_users`
  ADD COLUMN `discordId` VARCHAR(25) NULL,
  ADD UNIQUE INDEX `fdo_users_discordId_key` (`discordId`);
