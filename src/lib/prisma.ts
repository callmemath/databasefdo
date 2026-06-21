// Reimport the PrismaClient to ensure we're using the latest definition
import { PrismaClient, Prisma } from '@prisma/client';
import prismaIARP from './prisma-iarp';

// Funzione per estrarre un ID numerico dall'identifier.
// L'identifier ha formato "charN:hash" dove N è il numero personaggio.
// Il numero personaggio viene incorporato come fattore moltiplicativo in modo che
// char1 e char2 dello stesso giocatore abbiano ID diversi.
// Per charN=1: rawValue * 1 % maxInt + 1  → identico alla formula originale (backward compatible).
// maxInt = 2147483647 è primo di Mersenne: la moltiplicazione per qualsiasi charN > 0 è una biiezione.
function extractNumericId(identifier: string): number {
  if (!identifier) return 0;

  const parts = identifier.split(':');
  const prefix   = parts[0]; // es. "char1", "char2", "steam"
  const hashPart = parts.length > 1 ? parts[1] : identifier;

  // Numero personaggio (char1=1, char2=2, … default=1 per identifier non char)
  const charMatch = prefix.match(/^char(\d+)$/);
  const charNum   = charMatch ? parseInt(charMatch[1], 10) : 1;

  // Sanifica: mantieni solo cifre esadecimali
  const safeHash    = hashPart.replace(/[^0-9a-fA-F]/g, '0');
  const numericPart = safeHash.substring(0, 8).padEnd(8, '0');

  try {
    const rawValue  = BigInt(`0x${numericPart}`);
    const maxInt    = BigInt(2147483647);
    const charFactor = BigInt(charNum);
    // char1: rawValue * 1 % maxInt + 1 = vecchia formula ✅
    // char2+: ID univoco per slot personaggio, nessuna collisione tra PG dello stesso giocatore
    return Number((rawValue * charFactor % maxInt) + BigInt(1));
  } catch {
    return 0;
  }
}

// Definizione delle interfacce per i metodi estesi
export interface GameUser {
  id: number;
  identifier?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  dateofbirth?: string | null;
  sex?: string | null;
  nationality?: string | null;
  phone_number?: string | null;
  height?: string | null;
  
  // Campi di gioco (tutti stringhe come nella tabella reale)
  accounts?: string | null;      // JSON
  group?: string | null;
  inventory?: string | null;     // JSON
  job?: string | null;
  job_grade?: number | null;     // Number in database
  job2?: string | null;
  job2_grade?: number | null;    // Number in database
  loadout?: string | null;       // JSON
  metadata?: string | null;      // JSON
  position?: string | null;      // JSON
  status?: string | null;        // JSON
  is_dead?: number | null;       // Number 0 o 1
  
  // Aspetto
  skin?: string | null;          // JSON
  tattoos?: string | null;       // JSON
  
  // Dati aggiuntivi
  immProfilo?: string | null;
  bankingData?: string | null;   // JSON
  badge?: string | null;
  jail?: number | null;          // Number
  
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
  findGameUserByIdentifier(identifier: string): Promise<GameUser | null>;
}

// Funzioni di utilità per le query - ORA USANO IL DATABASE IARP
const findGameUsersQuery = async (
  prisma: PrismaClient,
  options: FindGameUsersOptions = {}
): Promise<FindGameUsersResult> => {
  const { where = {}, skip = 0, take = 10, orderBy = { lastname: 'asc' } } = options;
  
  // Costruisci il filtro Prisma per il database IARP
  const prismaWhere: any = {};
  
  if (where.OR && where.OR.length > 0) {
    prismaWhere.OR = where.OR.map((condition: any) => {
      const orCondition: any = {};
      if (condition.firstname?.contains) {
        orCondition.firstname = { contains: condition.firstname.contains };
      }
      if (condition.lastname?.contains) {
        orCondition.lastname = { contains: condition.lastname.contains };
      }
      return orCondition;
    });
  }
  
  // Esegui le query usando il client IARP
  const [total, users] = await Promise.all([
    prismaIARP.gameUser.count({ where: prismaWhere }),
    prismaIARP.gameUser.findMany({
      where: prismaWhere,
      skip,
      take,
      orderBy: { lastname: orderBy.lastname },
      select: {
        identifier: true,
        firstname: true,
        lastname: true,
        dateofbirth: true,
        sex: true,
        nationality: true,
        height: true,
      }
    })
  ]);
  
  // Aggiungi l'ID numerico estratto dall'identifier
  const usersWithId = users.map(user => ({
    ...user,
    id: extractNumericId(user.identifier || '')
  }));
  
  return { data: usersWithId as GameUser[], total };
};

const findGameUserByIdQuery = async (
  prisma: PrismaClient,
  id: number
): Promise<GameUser | null> => {
  // Ottieni tutti gli utenti e cerca quello con l'ID corrispondente
  // (l'ID è derivato dall'identifier, quindi dobbiamo controllare tutti)
  const allUsers = await prismaIARP.gameUser.findMany({
    select: {
      identifier: true,
      firstname: true,
      lastname: true,
      dateofbirth: true,
      sex: true,
      nationality: true,
      height: true,
      accounts: true,
      group: true,
      inventory: true,
      loadout: true,
      metadata: true,
      position: true,
      status: true,
      skin: true,
      // bankingData: true,  // Colonna non presente nel DB VPS
      // immProfilo: true,   // Colonna non presente nel DB VPS
      // tattoos: true,      // Colonna non presente nel DB VPS
    }
  });
  
  // Trova l'utente il cui ID corrisponde (formula corrente o legacy per record storici)
  const user = allUsers.find(u => {
    const ident = u.identifier || '';
    if (!ident) return false;
    if (extractNumericId(ident) === id) return true;
    // Fallback formula legacy (charNum ignorato): rawValue % maxInt + 1
    const hp = ident.split(':');
    const hashPart = hp.length > 1 ? hp[1] : ident;
    const safe = hashPart.replace(/[^0-9a-fA-F]/g, '0').substring(0, 8).padEnd(8, '0');
    try {
      const rv = BigInt(`0x${safe}`);
      return Number((rv % BigInt(2147483647)) + BigInt(1)) === id;
    } catch { return false; }
  });
  
  if (!user) return null;
  
  return {
    ...user,
    id: extractNumericId(user.identifier || '')
  } as GameUser;
};

const findGameUserByIdentifierQuery = async (
  prisma: PrismaClient,
  identifier: string
): Promise<GameUser | null> => {
  const user = await prismaIARP.gameUser.findUnique({
    where: { identifier },
    select: {
      identifier: true,
      firstname: true,
      lastname: true,
      dateofbirth: true,
      sex: true,
      nationality: true,
      height: true,
      accounts: true,
      group: true,
      inventory: true,
      loadout: true,
      metadata: true,
      position: true,
      status: true,
      skin: true,
      // bankingData: true,  // Colonna non presente nel DB VPS
      // immProfilo: true,   // Colonna non presente nel DB VPS
      // tattoos: true,      // Colonna non presente nel DB VPS
    }
  });

  if (!user) return null;

  return {
    ...user,
    id: extractNumericId(user.identifier || '')
  } as GameUser;
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
  prisma.findGameUserByIdentifier = (identifier) => findGameUserByIdentifierQuery(prisma, identifier);
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
  newPrisma.findGameUserByIdentifier = (identifier) => findGameUserByIdentifierQuery(newPrisma, identifier);
  
  global.prisma = newPrisma;
  prisma = global.prisma;
}

export default prisma;

// Export anche il PrismaClient base per operazioni che non richiedono estensioni
export { PrismaClient };
