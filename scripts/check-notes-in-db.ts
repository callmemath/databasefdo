// Script per verificare le note nel database
import prisma from '@/lib/prisma';

async function checkNotes() {
  try {
    console.log('🔍 Controllo note nel database...\n');
    
    // Conta tutte le note
    const count = await (prisma as any).citizenNote.count();
    console.log(`📊 Totale note nel database: ${count}\n`);
    
    if (count > 0) {
      // Mostra tutte le note
      const allNotes = await (prisma as any).citizenNote.findMany({
        include: {
          officer: {
            select: {
              id: true,
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
      
      console.log('📝 Tutte le note:\n');
      allNotes.forEach((note: any, index: number) => {
        console.log(`${index + 1}. ID: ${note.id}`);
        console.log(`   Cittadino ID: ${note.citizenId}`);
        console.log(`   Officer: ${note.officer?.name} ${note.officer?.surname} (${note.officer?.badge})`);
        console.log(`   Contenuto: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`);
        console.log(`   Creata: ${note.createdAt}`);
        console.log('');
      });
      
      // Raggruppa per citizenId
      const groupedByCitizen: any = {};
      allNotes.forEach((note: any) => {
        if (!groupedByCitizen[note.citizenId]) {
          groupedByCitizen[note.citizenId] = [];
        }
        groupedByCitizen[note.citizenId].push(note);
      });
      
      console.log('\n📊 Note per cittadino:');
      Object.keys(groupedByCitizen).forEach(citizenId => {
        console.log(`  Cittadino ${citizenId}: ${groupedByCitizen[citizenId].length} note`);
      });
      
    } else {
      console.log('⚠️  Nessuna nota trovata nel database!');
      console.log('\n💡 Prova a creare una nota dall\'interfaccia per testare.');
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
    if (error.code === 'P2021') {
      console.error('\n⚠️  La tabella fdo_citizen_notes non esiste!');
      console.error('Esegui: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkNotes();
