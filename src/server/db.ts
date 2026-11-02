import { PrismaClient } from "@prisma/client";

/**
 * Serverless: every instance opens its own pool, so prefer the pooled URL and keep
 * one connection per instance to stay under the database's connection limit.
 */
function runtimeUrl() {
  const pooled = process.env.DATABASE_URL_POOLED;
  const base = pooled?.startsWith("postgres") ? pooled : process.env.DATABASE_URL;
  if (!base || !process.env.VERCEL) return undefined;
  const url = new URL(base);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  if (base === pooled && !url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
  return url.toString();
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ datasourceUrl: runtimeUrl() });
g.prisma = prisma;
