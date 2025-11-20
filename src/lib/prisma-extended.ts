// Questo file è una soluzione temporanea per gestire la mancanza del modello GameUser nel client Prisma generato
import { PrismaClient, Prisma } from '@prisma/client';

// Definisci tipi per le opzioni e i risultati
interface GameUserOptions {
  where?: {
    OR?: Array<{
      firstname?: { contains: string };
      lastname?: { contains: string };
    }>;
  };
  skip?: number;
  take?: number;
  orderBy?: {
    lastname: 'asc' | 'desc';
  };
}

interface GameUser {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  dateofbirth?: string | null;
  sex?: string | null;
  nationality?: string | null;
  job?: string | null;
  job_grade?: number | null;
  job2?: string | null;
  job2_grade?: number | null;
  badge?: number | null;
  jail?: number | null;
  is_dead?: boolean | null;
  [key: string]: any;
}

interface GameUsersResult {
  data: GameUser[];
  total: number;
}

// Estendi il client Prisma per aggiungere metodi di accesso alla tabella users
class ExtendedPrismaClient extends PrismaClient {
  async findGameUsers(options: GameUserOptions = {}): Promise<GameUsersResult> {
    const { where = {}, skip = 0, take = 10, orderBy = { lastname: 'asc' } } = options;
    
    // Costruisci la clausola WHERE per la query SQL
    let whereClause = '';
    if (where.OR && where.OR.length > 0) {
      const conditions = where.OR.map((condition: any) => {
        if (condition.firstname?.contains) {
          return `firstname LIKE '%${condition.firstname.contains}%'`;
        }
        if (condition.lastname?.contains) {
          return `lastname LIKE '%${condition.lastname.contains}%'`;
        }
        return null;
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' OR ')}`;
      }
    }
    
    // Esegui la query per ottenere il conteggio totale
    const countResult = await this.$queryRaw(
      Prisma.sql`SELECT COUNT(*) as total FROM users ${whereClause ? Prisma.sql([whereClause]) : Prisma.sql``}`
    ) as Array<{total: bigint}>;
    
    const total = Number(countResult[0].total);
    
    // Esegui la query principale
    const users = await this.$queryRaw(
      Prisma.sql`
        SELECT 
          id, 
          firstname, 
          lastname, 
          dateofbirth, 
          sex, 
          nationality, 
          job, 
          job_grade, 
          job2, 
          job2_grade, 
          badge, 
          jail, 
          is_dead
        FROM users 
        ${whereClause ? Prisma.sql([whereClause]) : Prisma.sql``}
        ORDER BY lastname ASC
        LIMIT ${take} OFFSET ${skip}
      `
    ) as GameUser[];
    
    // Converti i valori BigInt in numeri JavaScript
    const formattedUsers = users.map(user => {
      const formattedUser = { ...user };
      for (const key in formattedUser) {
        if (typeof formattedUser[key] === 'bigint') {
          formattedUser[key] = Number(formattedUser[key]);
        }
      }
      return formattedUser;
    });
    
    return { data: formattedUsers, total };
  }
  
  async findGameUserById(id: number): Promise<GameUser | null> {
    const users = await this.$queryRaw(
      Prisma.sql`
        SELECT 
          id, 
          firstname, 
          lastname, 
          dateofbirth, 
          sex, 
          nationality, 
          job, 
          job_grade, 
          job2, 
          job2_grade, 
          badge, 
          jail, 
          is_dead,
          accounts,
          \`group\`, 
          inventory,
          loadout,
          metadata,
          position,
          status,
          skin,
          bankingData,
          immProfilo,
          tattoos
        FROM users 
        WHERE id = ${id}
      `
    ) as GameUser[];
    
    if (users.length === 0) return null;
    
    const user = users[0];
    // Converti i valori BigInt in numeri JavaScript
    for (const key in user) {
      if (typeof user[key] === 'bigint') {
        user[key] = Number(user[key]);
      }
    }
    
    return user;
  }
}

// Esporta una singola istanza del client esteso
const prismaExtended = new ExtendedPrismaClient();
export default prismaExtended;
