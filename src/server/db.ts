import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * Serverless (Vercel): direct Postgres connections run out quickly, so queries go through
 * Prisma Accelerate (PRISMA_DATABASE_URL, HTTP + managed pool) when it is configured.
 * Locally the plain DATABASE_URL connection is used.
 */
function create(): PrismaClient {
  const accelerateUrl = process.env.PRISMA_DATABASE_URL;
  if (process.env.VERCEL && accelerateUrl?.startsWith("prisma")) {
    return new PrismaClient({ datasourceUrl: accelerateUrl }).$extends(withAccelerate()) as unknown as PrismaClient;
  }
  return new PrismaClient();
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? create();
g.prisma = prisma;
