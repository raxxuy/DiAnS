import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient();
}

declare const globalThis: {
  db: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.db ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') globalThis.db = db;