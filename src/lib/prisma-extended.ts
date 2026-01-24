// Questo file è una soluzione temporanea per gestire la mancanza del modello GameUser nel client Prisma generato
import { PrismaClient, Prisma } from '@prisma/client';
import prismaIARP from './prisma-iarp';

// Funzione per estrarre un ID numerico dall'identifier
// L'identifier ha formato "char1:hash" - prendiamo la parte dopo i : e convertiamo i primi caratteri in numero
function extractNumericId(identifier: string): number {
  if (!identifier) return 0;
  
  // Estrai la parte dopo i :
  const parts = identifier.split(':');
  const hashPart = parts.length > 1 ? parts[1] : identifier;
  
  // Converti i primi 8 caratteri esadecimali in un numero
  // Questo genera un ID univoco ma consistente per ogni identifier
  const numericPart = hashPart.substring(0, 8);
  return parseInt(numericPart, 16);
}

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

interface GameUsersResult {
  data: GameUser[];
  total: number;
}

// Estendi il client Prisma per aggiungere metodi di accesso alla tabella users del database IARP
class ExtendedPrismaClient extends PrismaClient {
  async findGameUsers(options: GameUserOptions = {}): Promise<GameUsersResult> {
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
  }
  
  async findGameUserById(id: number): Promise<GameUser | null> {
    // Ottieni tutti gli utenti e cerca quello con l'ID corrispondente
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
        bankingData: true,
        immProfilo: true,
        tattoos: true,
      }
    });
    
    // Trova l'utente il cui ID numerico corrisponde
    const user = allUsers.find(u => extractNumericId(u.identifier || '') === id);
    
    if (!user) return null;
    
    return {
      ...user,
      id: extractNumericId(user.identifier || '')
    } as GameUser;
  }
}

// Esporta una singola istanza del client esteso
const prismaExtended = new ExtendedPrismaClient();
export default prismaExtended;
