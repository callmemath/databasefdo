// Client Prisma per database IARP (tabella users dei cittadini)
import { PrismaClient as PrismaClientIARP } from '@prisma/client-iarp';

declare global {
  var prismaIARP: PrismaClientIARP | undefined;
}

const prismaIARP = global.prismaIARP || new PrismaClientIARP();

if (process.env.NODE_ENV !== 'production') {
  global.prismaIARP = prismaIARP;
}

export default prismaIARP;
