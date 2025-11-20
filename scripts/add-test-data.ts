// File: /scripts/add-test-data.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Inizializza il client Prisma
const prisma = new PrismaClient();

// Funzione principale
async function main() {
  console.log('Avvio inserimento dati di test...');

  // 1. Creazione utenti di test (operatori FDO)
  console.log('Creazione utenti di test...');
  
  const passwordHash = await hash('password123', 10);
  
  const users = [
    {
      name: 'Marco',
      surname: 'Rossi',
      email: 'marco.rossi@polizia.it',
      password: passwordHash,
      badge: 'POL1234',
      department: 'Polizia',
      rank: 'Ispettore',
      image: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      name: 'Giulia',
      surname: 'Bianchi',
      email: 'giulia.bianchi@carabinieri.it',
      password: passwordHash,
      badge: 'CC5678',
      department: 'Carabinieri',
      rank: 'Tenente',
      image: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      name: 'Alessandro',
      surname: 'Verdi',
      email: 'alessandro.verdi@gdf.it',
      password: passwordHash,
      badge: 'GDF9012',
      department: 'Guardia di Finanza',
      rank: 'Maresciallo',
      image: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
  ];

  // Inserisci gli utenti uno per uno e salva gli ID per riferimenti futuri
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      try {
        // Controlla se l'utente esiste già
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existingUser) {
          console.log(`Utente ${user.email} già esistente, lo salto...`);
          return existingUser;
        }

        // Crea nuovo utente
        const newUser = await prisma.user.create({
          data: user
        });
        console.log(`Utente creato: ${newUser.name} ${newUser.surname}`);
        return newUser;
      } catch (error) {
        console.error(`Errore durante la creazione dell'utente ${user.email}:`, error);
        throw error;
      }
    })
  );

  // 2. Creazione cittadini di test (GameUser)
  console.log('Creazione cittadini di test...');
  
  const gameUsers = [
    {
      identifier: 'steam:111111111111111',
      firstname: 'Antonio',
      lastname: 'Ferrari',
      dateofbirth: '1985-05-15',
      sex: 'M',
      height: 178,
      phone_number: '3331234567',
      group: 'user',
      job: 'mechanic',
      job_grade: 2,
      nationality: 'italiana',
      immProfilo: 'https://randomuser.me/api/portraits/men/11.jpg'
    },
    {
      identifier: 'steam:222222222222222',
      firstname: 'Sofia',
      lastname: 'Martini',
      dateofbirth: '1990-10-22',
      sex: 'F',
      height: 165,
      phone_number: '3369876543',
      group: 'user',
      job: 'taxi',
      job_grade: 1,
      nationality: 'italiana',
      immProfilo: 'https://randomuser.me/api/portraits/women/12.jpg'
    },
    {
      identifier: 'steam:333333333333333',
      firstname: 'Luca',
      lastname: 'Romano',
      dateofbirth: '1978-03-08',
      sex: 'M',
      height: 182,
      phone_number: '3385556677',
      group: 'user',
      job: 'unemployed',
      job_grade: 0,
      nationality: 'italiana',
      immProfilo: 'https://randomuser.me/api/portraits/men/13.jpg'
    },
    {
      identifier: 'steam:444444444444444',
      firstname: 'Elena',
      lastname: 'Costa',
      dateofbirth: '1995-12-30',
      sex: 'F',
      height: 170,
      phone_number: '3399998877',
      group: 'user',
      job: 'ambulance',
      job_grade: 3,
      nationality: 'italiana',
      immProfilo: 'https://randomuser.me/api/portraits/women/14.jpg'
    },
    {
      identifier: 'steam:555555555555555',
      firstname: 'Mario',
      lastname: 'Rizzo',
      dateofbirth: '1980-07-19',
      sex: 'M',
      height: 175,
      phone_number: '3334445566',
      group: 'user',
      job: 'dealer',
      job_grade: 1,
      nationality: 'italiana',
      immProfilo: 'https://randomuser.me/api/portraits/men/15.jpg'
    }
  ];

  const createdGameUsers = await Promise.all(
    gameUsers.map(async (gameUser) => {
      try {
        // Controlla se il cittadino esiste già
        const existingGameUser = await prisma.gameUser.findUnique({
          where: { identifier: gameUser.identifier }
        });

        if (existingGameUser) {
          console.log(`GameUser ${gameUser.firstname} ${gameUser.lastname} già esistente, lo salto...`);
          return existingGameUser;
        }

        // Crea nuovo cittadino
        const newGameUser = await prisma.gameUser.create({
          data: gameUser
        });
        console.log(`GameUser creato: ${newGameUser.firstname} ${newGameUser.lastname}`);
        return newGameUser;
      } catch (error) {
        console.error(`Errore durante la creazione del cittadino ${gameUser.firstname} ${gameUser.lastname}:`, error);
        throw error;
      }
    })
  );

  // 3. Creazione arresti di test
  console.log('Creazione arresti di test...');
  
  const arrests = [
    {
      location: 'Via Roma, 123',
      description: 'Arrestato per guida in stato di ebbrezza',
      charges: 'Guida in stato di ebbrezza, Resistenza a pubblico ufficiale',
      citizenId: createdGameUsers[0].id,
      officerId: createdUsers[0].id,
      sentence: '3 mesi',
      fine: 1500,
      incidentDescription: 'Il soggetto è stato fermato ad un posto di blocco e trovato con un tasso alcolemico di 1.5 g/l. Ha tentato di fuggire a piedi.',
      seizedItems: 'Patente di guida, Cellulare',
      department: 'Polizia',
      signingOfficers: [
        { id: createdUsers[0].id, name: `${createdUsers[0].name} ${createdUsers[0].surname}`, badge: createdUsers[0].badge }
      ]
    },
    {
      location: 'Piazza Garibaldi, 45',
      description: 'Arrestato per furto in abitazione',
      charges: 'Furto aggravato, Danneggiamento',
      citizenId: createdGameUsers[2].id,
      officerId: createdUsers[1].id,
      sentence: '1 anno',
      fine: 5000,
      incidentDescription: 'Il soggetto è stato colto in flagrante mentre cercava di entrare in un appartamento da una finestra sul retro.',
      seizedItems: 'Arnesi da scasso, Refurtiva',
      department: 'Carabinieri',
      signingOfficers: [
        { id: createdUsers[1].id, name: `${createdUsers[1].name} ${createdUsers[1].surname}`, badge: createdUsers[1].badge }
      ],
      accomplices: [
        { id: createdGameUsers[4].id, name: `${createdGameUsers[4].firstname} ${createdGameUsers[4].lastname}`, birthDate: createdGameUsers[4].dateofbirth }
      ]
    },
    {
      location: 'Via Napoli, 78',
      description: 'Arrestato per spaccio di stupefacenti',
      charges: 'Spaccio di sostanze stupefacenti',
      citizenId: createdGameUsers[4].id,
      officerId: createdUsers[2].id,
      sentence: '2 anni',
      fine: 10000,
      incidentDescription: 'Il soggetto è stato trovato in possesso di 50g di cocaina e 100g di marijuana, suddivisi in dosi pronte per lo spaccio.',
      seizedItems: 'Sostanze stupefacenti, Contanti (€2500), Bilancino di precisione',
      department: 'Guardia di Finanza',
      signingOfficers: [
        { id: createdUsers[2].id, name: `${createdUsers[2].name} ${createdUsers[2].surname}`, badge: createdUsers[2].badge }
      ]
    }
  ];

  for (const arrest of arrests) {
    try {
      const signingOfficers = arrest.signingOfficers;
      const accomplices = arrest.accomplices || null;
      
      // Crea l'arresto con i campi base
      const newArrest = await prisma.arrest.create({
        data: {
          location: arrest.location,
          description: arrest.description,
          charges: arrest.charges,
          date: new Date(),
          citizenId: arrest.citizenId,
          officerId: arrest.officerId,
          sentence: arrest.sentence,
          fine: arrest.fine,
          incidentDescription: arrest.incidentDescription,
          seizedItems: arrest.seizedItems,
          department: arrest.department,
          signingOfficers: signingOfficers as any,
          accomplices: accomplices as any
        }
      });
      
      console.log(`Arresto creato: ${newArrest.id}`);
    } catch (error) {
      console.error(`Errore durante la creazione dell'arresto:`, error);
    }
  }

  // 4. Creazione rapporti/denunce di test
  console.log('Creazione rapporti/denunce di test...');
  
  const reports = [
    {
      title: 'Denuncia per furto di veicolo',
      description: 'La vittima ha denunciato il furto della propria auto parcheggiata in strada durante la notte.',
      type: 'Furto',
      location: 'Via Milano, 55',
      isAnonymous: false,
      officerId: createdUsers[0].id,
      citizenId: createdGameUsers[1].id,
      accusedId: null
    },
    {
      title: 'Rapporto su disturbo della quiete pubblica',
      description: 'Segnalazione di musica ad alto volume e schiamazzi provenienti da un appartamento dopo le 23:00.',
      type: 'Disturbo',
      location: 'Viale Dante, 120',
      isAnonymous: true,
      officerId: createdUsers[1].id,
      citizenId: null,
      accusedId: createdGameUsers[0].id
    },
    {
      title: 'Denuncia per aggressione',
      description: 'La vittima è stata aggredita fisicamente all\'uscita di un locale notturno.',
      type: 'Aggressione',
      location: 'Piazza della Repubblica, 8',
      isAnonymous: false,
      officerId: createdUsers[2].id,
      citizenId: createdGameUsers[3].id,
      accusedId: createdGameUsers[2].id
    }
  ];

  for (const report of reports) {
    try {
      const newReport = await prisma.report.create({
        data: report
      });
      
      console.log(`Rapporto creato: ${newReport.id}`);
    } catch (error) {
      console.error(`Errore durante la creazione del rapporto:`, error);
    }
  }

  // 5. Creazione ricercati di test
  console.log('Creazione ricercati di test...');
  
  const wantedPersons = [
    {
      citizenId: createdGameUsers[2].id,
      crimes: 'Rapina a mano armata, Lesioni personali',
      description: 'Sospettato di aver rapinato una gioielleria in centro città, ferendo due dipendenti.',
      lastSeen: 'Visto l\'ultima volta nella zona nord della città, vicino alla stazione.',
      dangerLevel: 'high',
      bounty: 10000,
      status: 'active',
      notes: 'Potrebbe essere armato e pericoloso. Avvicinare con cautela.',
      imageUrl: 'https://randomuser.me/api/portraits/men/13.jpg',
      officerId: createdUsers[0].id
    },
    {
      citizenId: createdGameUsers[4].id,
      crimes: 'Traffico di stupefacenti, Associazione a delinquere',
      description: 'A capo di una rete di spaccio di droga nella zona est della città.',
      lastSeen: 'Visto nei pressi del porto commerciale.',
      dangerLevel: 'medium',
      bounty: 7500,
      status: 'active',
      notes: 'Ha contatti con organizzazioni criminali straniere. Spesso accompagnato da guardie del corpo.',
      imageUrl: 'https://randomuser.me/api/portraits/men/15.jpg',
      officerId: createdUsers[1].id
    }
  ];

  for (const wantedPerson of wantedPersons) {
    try {
      const newWanted = await prisma.wanted.create({
        data: wantedPerson
      });
      
      console.log(`Ricercato creato: ${newWanted.id}`);
    } catch (error) {
      console.error(`Errore durante la creazione del ricercato:`, error);
    }
  }

  console.log('Inserimento dei dati di test completato con successo!');
}

// Esegui la funzione principale
main()
  .catch((e) => {
    console.error('Errore durante l\'esecuzione dello script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Chiudi la connessione al database
    await prisma.$disconnect();
  });
