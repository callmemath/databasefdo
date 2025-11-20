// Reimport the PrismaClient to ensure we're using the latest definition
import { PrismaClient, Prisma } from '@prisma/client';

// Definizione delle interfacce per i metodi estesi
export interface GameUser {
  id: number;
  identifier?: string | null;
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
  accounts?: string | null;
  group?: string | null;
  inventory?: string | null;
  loadout?: string | null;
  metadata?: string | null;
  position?: string | null;
  status?: string | null;
  skin?: string | null;
  bankingData?: string | null;
  immProfilo?: string | null;
  tattoos?: string | null;
  height?: number | null;
  phone_number?: string | null;
  last_updated?: Date | null;
  [key: string]: any;
}

export interface FindGameUsersOptions {
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

export interface FindGameUsersResult {
  data: GameUser[];
  total: number;
}

// Estendi l'interfaccia di PrismaClient per aggiungere i nostri metodi personalizzati
interface PrismaClientExtended extends PrismaClient {
  findGameUsers(options?: FindGameUsersOptions): Promise<FindGameUsersResult>;
  findGameUserById(id: number): Promise<GameUser | null>;
}

// Funzioni di utilità per le query
const findGameUsersQuery = async (
  prisma: PrismaClient,
  options: FindGameUsersOptions = {}
): Promise<FindGameUsersResult> => {
  const { where = {}, skip = 0, take = 10, orderBy = { lastname: 'asc' } } = options;
  
  // Costruisci la clausola WHERE per la query SQL in modo più efficiente
  let whereClause = '';
  if (where.OR && where.OR.length > 0) {
    // Rimuovi condizioni duplicate per evitare ricerche ridondanti
    const uniqueConditions = new Set<string>();
    
    where.OR.forEach((condition: any) => {
      if (condition.firstname?.contains) {
        uniqueConditions.add(`firstname LIKE '%${condition.firstname.contains}%'`);
      }
      if (condition.lastname?.contains) {
        uniqueConditions.add(`lastname LIKE '%${condition.lastname.contains}%'`);
      }
    });
    
    const conditions = Array.from(uniqueConditions);
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' OR ')}`;
    }
  }
  
  // Esegui la query per ottenere il conteggio totale
  const countResult = await prisma.$queryRaw(
    Prisma.sql`SELECT COUNT(*) as total FROM users ${whereClause ? Prisma.sql([whereClause]) : Prisma.sql``}`
  ) as Array<{total: bigint}>;
  
  const total = Number(countResult[0].total);
  
  // Esegui la query principale
  const users = await prisma.$queryRaw(
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
};

const findGameUserByIdQuery = async (
  prisma: PrismaClient,
  id: number
): Promise<GameUser | null> => {
  const users = await prisma.$queryRaw(
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
};

// Clear any cached instances that might have old schema
let prisma: PrismaClientExtended;

declare global {
  var prisma: PrismaClientExtended | undefined;
}

// In production, create new instance with optimized settings
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'], // Solo errori in produzione
    errorFormat: 'minimal',
  }) as PrismaClientExtended;
  prisma.findGameUsers = (options) => findGameUsersQuery(prisma, options);
  prisma.findGameUserById = (id) => findGameUserByIdQuery(prisma, id);
} else {
  // In development, clear any existing instance and create a new one
  if (global.prisma) {
    global.prisma.$disconnect();
    global.prisma = undefined;
  }
  
  const newPrisma = new PrismaClient({
    log: ['error', 'warn'], // Ridotto il logging anche in dev
    errorFormat: 'pretty',
  }) as PrismaClientExtended;
  
  newPrisma.findGameUsers = (options) => findGameUsersQuery(newPrisma, options);
  newPrisma.findGameUserById = (id) => findGameUserByIdQuery(newPrisma, id);
  
  global.prisma = newPrisma;
  prisma = global.prisma;
}

export default prisma;
