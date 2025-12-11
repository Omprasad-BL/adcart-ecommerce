import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

// neon() returns a "sql" function – THIS is required by PrismaNeon
const sql = neon(connectionString);

// Correct adapter initialization
const adapter = new PrismaNeon({ sql });

// Prevent multiple instances in dev
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
