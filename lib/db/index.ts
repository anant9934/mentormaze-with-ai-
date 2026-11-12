import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Lazy-initialized database client
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance && connectionString && !connectionString.includes("localhost:5432")) {
    try {
      const client = postgres(connectionString, {
        prepare: false,
        max: 5,
        connect_timeout: 3,
      });
      dbInstance = drizzle(client, { schema });
    } catch {
      // In local dev without live postgres, fallback to repository memory store
      dbInstance = null;
    }
  }
  return dbInstance;
}

export { schema };
