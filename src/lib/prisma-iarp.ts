// Client Prisma per database IARP (tabella users dei cittadini)
import { PrismaClient as PrismaClientIARP } from '@prisma/client-iarp';

declare global {
  var prismaIARP: PrismaClientIARP | undefined;
}

// Configurazione ottimizzata per ridurre uso memoria
const prismaConfig = {
  log: process.env.NODE_ENV === 'production' ? [] : ['error'],
  errorFormat: 'minimal' as const,
};

const prismaIARP = global.prismaIARP || new PrismaClientIARP(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prismaIARP = prismaIARP;
}

export default prismaIARP;
