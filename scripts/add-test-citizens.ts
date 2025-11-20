import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Creazione cittadini di test...\n');

  const citizens = [
    {
      identifier: 'steam:110000103fa91c1',
      firstname: 'Marco',
      lastname: 'Rossi',
      dateofbirth: '1985-03-15',
      sex: 'M',
      height: 180,
      phone_number: '555-0101',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c2',
      firstname: 'Giulia',
      lastname: 'Bianchi',
      dateofbirth: '1990-07-22',
      sex: 'F',
      height: 165,
      phone_number: '555-0102',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c3',
      firstname: 'Luca',
      lastname: 'Verdi',
      dateofbirth: '1988-11-10',
      sex: 'M',
      height: 175,
      phone_number: '555-0103',
      nationality: 'Italiana',
      job: 'mechanic',
      job_grade: 2,
    },
    {
      identifier: 'steam:110000103fa91c4',
      firstname: 'Sofia',
      lastname: 'Neri',
      dateofbirth: '1992-05-18',
      sex: 'F',
      height: 170,
      phone_number: '555-0104',
      nationality: 'Italiana',
      job: 'doctor',
      job_grade: 1,
    },
    {
      identifier: 'steam:110000103fa91c5',
      firstname: 'Alessandro',
      lastname: 'Ferrari',
      dateofbirth: '1983-09-25',
      sex: 'M',
      height: 182,
      phone_number: '555-0105',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c6',
      firstname: 'Francesca',
      lastname: 'Romano',
      dateofbirth: '1995-01-30',
      sex: 'F',
      height: 168,
      phone_number: '555-0106',
      nationality: 'Italiana',
      job: 'lawyer',
      job_grade: 3,
    },
    {
      identifier: 'steam:110000103fa91c7',
      firstname: 'Giovanni',
      lastname: 'Colombo',
      dateofbirth: '1987-12-05',
      sex: 'M',
      height: 178,
      phone_number: '555-0107',
      nationality: 'Italiana',
      job: 'taxi',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c8',
      firstname: 'Elena',
      lastname: 'Ricci',
      dateofbirth: '1991-04-14',
      sex: 'F',
      height: 163,
      phone_number: '555-0108',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c9',
      firstname: 'Matteo',
      lastname: 'Marino',
      dateofbirth: '1989-08-20',
      sex: 'M',
      height: 185,
      phone_number: '555-0109',
      nationality: 'Italiana',
      job: 'mechanic',
      job_grade: 1,
    },
    {
      identifier: 'steam:110000103fa91c10',
      firstname: 'Chiara',
      lastname: 'Greco',
      dateofbirth: '1993-06-12',
      sex: 'F',
      height: 167,
      phone_number: '555-0110',
      nationality: 'Italiana',
      job: 'reporter',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c11',
      firstname: 'Andrea',
      lastname: 'Bruno',
      dateofbirth: '1986-02-28',
      sex: 'M',
      height: 179,
      phone_number: '555-0111',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c12',
      firstname: 'Valentina',
      lastname: 'Gallo',
      dateofbirth: '1994-10-08',
      sex: 'F',
      height: 166,
      phone_number: '555-0112',
      nationality: 'Italiana',
      job: 'doctor',
      job_grade: 2,
    },
    {
      identifier: 'steam:110000103fa91c13',
      firstname: 'Roberto',
      lastname: 'Costa',
      dateofbirth: '1984-07-03',
      sex: 'M',
      height: 183,
      phone_number: '555-0113',
      nationality: 'Italiana',
      job: 'cardealer',
      job_grade: 1,
    },
    {
      identifier: 'steam:110000103fa91c14',
      firstname: 'Sara',
      lastname: 'Fontana',
      dateofbirth: '1996-03-21',
      sex: 'F',
      height: 164,
      phone_number: '555-0114',
      nationality: 'Italiana',
      job: 'unemployed',
      job_grade: 0,
    },
    {
      identifier: 'steam:110000103fa91c15',
      firstname: 'Davide',
      lastname: 'Leone',
      dateofbirth: '1990-11-16',
      sex: 'M',
      height: 181,
      phone_number: '555-0115',
      nationality: 'Italiana',
      job: 'taxi',
      job_grade: 2,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const citizenData of citizens) {
    try {
      const existing = await prisma.gameUser.findUnique({
        where: { identifier: citizenData.identifier },
      });

      if (existing) {
        await prisma.gameUser.update({
          where: { identifier: citizenData.identifier },
          data: citizenData,
        });
        updated++;
        console.log(`🔄 Aggiornato: ${citizenData.firstname} ${citizenData.lastname} (ID: ${existing.id})`);
      } else {
        const citizen = await prisma.gameUser.create({
          data: citizenData,
        });
        created++;
        console.log(`✅ Creato: ${citizen.firstname} ${citizen.lastname} (ID: ${citizen.id})`);
      }
    } catch (error) {
      console.error(`❌ Errore con ${citizenData.firstname} ${citizenData.lastname}:`, error);
    }
  }

  console.log('\n📊 Riepilogo:');
  console.log(`   ✅ Cittadini creati: ${created}`);
  console.log(`   🔄 Cittadini aggiornati: ${updated}`);
  console.log(`   📋 Totale processati: ${created + updated}/${citizens.length}\n`);
  
  console.log('✨ Operazione completata!');
  console.log('💡 Ora puoi usare questi cittadini per creare porto d\'armi, arresti e denunce.\n');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
