// Script per verificare e creare la tabella fdo_citizen_notes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateCitizenNotesTable() {
  try {
    console.log('🔍 Verifico se la tabella fdo_citizen_notes esiste...');
    
    // Prova a contare le note
    const count = await (prisma as any).citizenNote.count();
    console.log(`✅ Tabella fdo_citizen_notes trovata! Note presenti: ${count}`);
    
    // Mostra alcune note di esempio se esistono
    if (count > 0) {
      const notes = await (prisma as any).citizenNote.findMany({
        take: 5,
        include: {
          officer: {
            select: {
              name: true,
              surname: true,
              badge: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n📝 Ultime 5 note:');
      notes.forEach((note: any) => {
        console.log(`- ID: ${note.id}, Cittadino: ${note.citizenId}, Officer: ${note.officer?.name} ${note.officer?.surname} (${note.officer?.badge})`);
        console.log(`  Contenuto: ${note.content.substring(0, 50)}...`);
        console.log(`  Data: ${note.createdAt}`);
      });
    }
    
  } catch (error: any) {
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('❌ La tabella fdo_citizen_notes NON esiste!');
      console.log('\n📋 Esegui questo comando SQL per crearla:');
      console.log(`
CREATE TABLE fdo_citizen_notes (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  content TEXT NOT NULL,
  citizenId INT NOT NULL,
  officerId VARCHAR(191) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX fdo_citizen_notes_citizenId_idx (citizenId),
  INDEX fdo_citizen_notes_officerId_idx (officerId),
  CONSTRAINT fdo_citizen_notes_officerId_fkey 
    FOREIGN KEY (officerId) REFERENCES fdo_users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
      `);
      
      console.log('\n🚀 Oppure esegui: npx prisma db push');
    } else {
      console.error('❌ Errore durante la verifica:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateCitizenNotesTable();
