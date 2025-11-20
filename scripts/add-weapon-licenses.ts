import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔫 Creazione porto d\'armi di test...\n');

  // Verifica che esista almeno un cittadino
  const citizen = await prisma.gameUser.findFirst();
  
  if (!citizen) {
    console.log('❌ Nessun cittadino trovato nel database!');
    console.log('💡 Suggerimento: Importa prima i dati dei cittadini.');
    return;
  }

  // Verifica che esista almeno un operatore
  const officer = await prisma.user.findFirst();
  
  if (!officer) {
    console.log('❌ Nessun operatore trovato nel database!');
    console.log('💡 Suggerimento: Esegui prima lo script add-test-user.ts');
    return;
  }

  console.log(`✅ Cittadino: ${citizen.firstname} ${citizen.lastname} (ID: ${citizen.id})`);
  console.log(`✅ Operatore: ${officer.name} ${officer.surname} (${officer.badge})\n`);

  // Crea alcuni porto d'armi di esempio
  const licenses = [
    {
      licenseNumber: 'PDA-2024-001234',
      citizenId: citizen.id,
      licenseType: 'sport_target',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2029-01-15'),
      issuingAuthority: 'Questura di Roma',
      restrictions: 'Autorizzato solo per tiro al bersaglio presso poligoni autorizzati',
      authorizedWeapons: [
        {
          type: 'Pistola',
          caliber: '9mm',
          model: 'Beretta 92FS',
          serialNumber: 'BER92-123456',
        },
        {
          type: 'Carabina',
          caliber: '.22 LR',
          model: 'Ruger 10/22',
          serialNumber: 'RUG22-789012',
        },
      ],
      notes: 'Titolare tesserato presso Tiro a Segno Nazionale',
      status: 'active',
      officerId: officer.id,
    },
    {
      licenseNumber: 'PDA-2024-002456',
      citizenId: citizen.id,
      licenseType: 'hunting',
      issueDate: new Date('2023-06-20'),
      expiryDate: new Date('2028-06-20'),
      issuingAuthority: 'Questura di Milano',
      restrictions: 'Valido per caccia di selezione e caccia grossa',
      authorizedWeapons: [
        {
          type: 'Fucile da caccia',
          caliber: '12 GA',
          model: 'Benelli M2',
          serialNumber: 'BEN12-345678',
        },
      ],
      notes: 'Licenza di caccia rinnovata regolarmente. Tesserino venatorio in regola.',
      status: 'active',
      officerId: officer.id,
    },
    {
      licenseNumber: 'PDA-2023-998877',
      citizenId: citizen.id,
      licenseType: 'defense',
      issueDate: new Date('2023-03-10'),
      expiryDate: new Date('2025-10-01'),
      issuingAuthority: 'Questura di Napoli',
      restrictions: 'Porto d\'armi per difesa personale. Non autorizzato il trasporto in luoghi pubblici.',
      authorizedWeapons: [
        {
          type: 'Revolver',
          caliber: '.38 Special',
          model: 'Smith & Wesson Model 10',
          serialNumber: 'SW38-112233',
        },
      ],
      notes: 'Licenza in scadenza a breve. Richiedere rinnovo.',
      status: 'active',
      officerId: officer.id,
    },
  ];

  for (const licenseData of licenses) {
    try {
      const license = await prisma.weaponLicense.upsert({
        where: { licenseNumber: licenseData.licenseNumber },
        update: licenseData,
        create: licenseData,
      });

      console.log(`✅ Porto d'armi creato/aggiornato:`);
      console.log(`   N°: ${license.licenseNumber}`);
      console.log(`   Tipo: ${license.licenseType}`);
      console.log(`   Stato: ${license.status}`);
      console.log(`   Scadenza: ${license.expiryDate.toLocaleDateString('it-IT')}`);
      console.log(`   Armi: ${(license.authorizedWeapons as any[])?.length || 0}\n`);
    } catch (error) {
      console.error(`❌ Errore nella creazione del porto d'armi ${licenseData.licenseNumber}:`, error);
    }
  }

  console.log('✨ Operazione completata!');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
