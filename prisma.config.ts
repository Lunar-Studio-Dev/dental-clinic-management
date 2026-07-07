// Prisma 7 config. Loads secrets from `.env.local` (Next.js convention) so the
// Prisma CLI (db push / generate / studio) and seed scripts see DATABASE_URL.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
