// Import the standard PrismaClient directly from @prisma/client
import { PrismaClient } from '@prisma/client';

// Create a separate instance for the Wanted operations
const prismaWanted = new PrismaClient();

export default prismaWanted;
