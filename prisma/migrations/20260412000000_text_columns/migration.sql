-- AlterTable: cambia le colonne VARCHAR(191) in TEXT per supportare testi più lunghi
-- Necessario perché la selezione multipla di reati può superare 191 caratteri nel campo charges

ALTER TABLE `fdo_arrests` MODIFY `description` TEXT NOT NULL;
ALTER TABLE `fdo_arrests` MODIFY `charges` TEXT NOT NULL;
ALTER TABLE `fdo_arrests` MODIFY `sentence` TEXT NULL;
ALTER TABLE `fdo_arrests` MODIFY `incidentDescription` TEXT NULL;
ALTER TABLE `fdo_arrests` MODIFY `seizedItems` TEXT NULL;
