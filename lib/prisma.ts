// Prisma client singleton (Prisma 7 + Neon driver adapter, required by the Query Compiler).
// Guarded against hot-reload duplication in dev.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "~/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
