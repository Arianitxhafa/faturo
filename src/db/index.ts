import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add your Neon connection string to .env.local");
}

// HTTP driver: one round trip per query, ideal for serverless. Use db.batch() for atomic multi-statement writes.
export const db = drizzle(neon(process.env.DATABASE_URL), { schema });
