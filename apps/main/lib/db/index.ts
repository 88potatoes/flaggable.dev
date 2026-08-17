import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

import * as schema from "./schema";

/** Create a typed Drizzle client for the request's Cloudflare D1 binding. */
export function getDb() {
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof getDb>;
