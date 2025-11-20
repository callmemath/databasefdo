import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creazione utenti di test...\n');

  const users = [
    {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@polizia.it',
      password: 'password123',
      badge: 'P-1001',
      department: 'Polizia di Stato',
      rank: 'Ispettore',
    },
    {
      name: 'Luca',
      surname: 'Bianchi',
      email: 'luca.bianchi@carabinieri.it',
      password: 'password123',
      badge: 'C-2345',
      department: 'Arma dei Carabinieri',
      rank: 'Maresciallo',
    },
    {
      name: 'Giulia',
      surname: 'Verdi',
      email: 'giulia.verdi@polizia.it',
      password: 'password123',
      badge: 'P-1250',
      department: 'Polizia di Stato',
      rank: 'Commissario',
    },
  ];

  for (const userData of users) {
    const hashedPassword = await hash(userData.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
      },
      create: {
        ...userData,
        password: hashedPassword,
      },
    });

    console.log(`✅ Utente creato/aggiornato: ${user.name} ${user.surname} (${user.email})`);
    console.log(`   Badge: ${user.badge} | Department: ${user.department} | Rank: ${user.rank}\n`);
  }

  console.log('✨ Tutti gli utenti sono stati creati con successo!');
  console.log('🔑 Password per tutti gli utenti: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
