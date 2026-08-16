# flaggable.dev

Feature flags for people who ship. The app runs on Cloudflare Workers with Cloudflare D1 and Drizzle ORM.

## Scripts

- `pnpm run dev` starts the vinext dev server.
- `pnpm run build` builds the Cloudflare Worker output.
- `pnpm run start` starts the built Worker locally with Wrangler.
- `pnpm run deploy` deploys the Cloudflare Worker.
- `pnpm run db:generate` generates SQL migrations from `lib/db/schema.ts`.
- `pnpm run db:migrate:local` applies migrations to the local D1 database.
- `pnpm run db:migrate:remote` applies migrations to the configured remote D1 database.
- `pnpm run cf-typegen` regenerates Cloudflare binding types.

## Database

- D1 binding: `DB`
- Drizzle schema: `lib/db/schema.ts`
- Drizzle config: `drizzle.config.ts`
- Migrations: `drizzle/`

The D1 database ID is intentionally not committed. Create the database, then add its ID to `wrangler.jsonc`:

```sh
pnpm exec wrangler d1 create flaggable-dev
```

Copy the returned `database_id` into the `d1_databases` entry before running `pnpm run db:migrate:remote`.

