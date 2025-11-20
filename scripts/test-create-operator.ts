import { PrismaClient } from '@prisma/client';

// Crea una nuova istanza di PrismaClient
const prisma = new PrismaClient();

async function main() {
  try {
    // Crea un nuovo operatore per ogni dipartimento per testare la visualizzazione
    const departments = ['Polizia', 'Carabinieri', 'LSPD', 'Administration'];
    
    for (let i = 0; i < departments.length; i++) {
      const department = departments[i];
      
      const newOperator = await prisma.user.create({
        data: {
          name: `Test${i}`,
          surname: `Operator${i}`,
          email: `test${i}@${department.toLowerCase()}.it`,
          password: '$2b$10$YlCsVzZO7H6fkQ1DpgO3/OKQfBAf2PDHkg6l.6wVIc.QoaOKmTska', // hashed 'password123'
          badge: `BADGE${i}${department.charAt(0)}`,
          department: department,
          rank: 'Agente',
        }
      });
      
      console.log(`Created operator: ${newOperator.name} ${newOperator.surname} in department ${newOperator.department}`);
    }
    
    console.log('Test operators created successfully!');
  } catch (error) {
    console.error('Error creating test operators:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la funzione principale
main();
