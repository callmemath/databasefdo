-- Script per creare la tabella fdo_citizen_notes se non esiste

-- Crea la tabella fdo_citizen_notes
CREATE TABLE IF NOT EXISTS fdo_citizen_notes (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  content TEXT NOT NULL,
  citizenId INT NOT NULL,
  officerId VARCHAR(191) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX fdo_citizen_notes_citizenId_idx (citizenId),
  INDEX fdo_citizen_notes_officerId_idx (officerId),
  CONSTRAINT fdo_citizen_notes_officerId_fkey 
    FOREIGN KEY (officerId) REFERENCES fdo_users(id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verifica che la tabella sia stata creata
SELECT 'Tabella fdo_citizen_notes creata con successo!' AS message;

-- Mostra la struttura della tabella
DESCRIBE fdo_citizen_notes;
