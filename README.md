# flaggable.dev

Feature flags for people who ship. This repository contains two Cloudflare Workers in one pnpm workspace:

- `apps/landing` — public marketing site for `flaggable.dev`.
- `apps/main` — authenticated product app for `dev.flaggable.dev`, including Auth0, API routes, and D1.
- `packages/ui` — shared design-system components, utilities, and responsive hooks.

## Development

Install dependencies from the repository root:

```sh
pnpm install
```

Run each app in a separate terminal:

```sh
pnpm run dev:landing # landing app
pnpm run dev:main    # product app
```

The landing app links to the main app using `MAIN_APP_URL`. The local default is `http://localhost:3000`.

## Build and deploy

Development deploys run automatically through GitHub Actions on every relevant push to `main`. The workflow is `.github/workflows/deploy-dev.yml`; it deploys the landing Worker and the main development environment.

Production main deploys are manual through `.github/workflows/deploy-production.yml`. In GitHub Actions, choose **Deploy Cloudflare Production → Run workflow**. The production job uses the `production` GitHub environment, so you can require approval before it deploys.

Add these repository secrets in GitHub under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN` — API token with the required Workers and D1 permissions.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.

The workflow uses Wrangler's `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables, so no Cloudflare login step is needed in CI.

```sh
pnpm run build
pnpm run deploy:landing       # landing Worker
pnpm run deploy:main          # main development environment
pnpm run deploy:main:production # main production environment
```

Each app also has `start`, `preview`, and `deploy` scripts. Their generated Cloudflare output lives under the app's ignored `dist/` directory.

Configure DNS or custom domains so that:

- `flaggable.dev` points to `flaggable-dev-landing`.
- `dev.flaggable.dev` points to the default `flaggable-dev-1` environment.
- `app.flaggable.dev` points to the `production` environment of `flaggable-dev-1`.

## Shared design system

The reusable UI primitives live in `packages/ui/src/ui/`. Main imports them through workspace package subpaths, for example:

```ts
import { Button } from "@flaggable/ui/button";
import { cn } from "@flaggable/ui/utils";
```

Add the package to another workspace app with:

```sh
pnpm --filter @flaggable/landing add @flaggable/ui@workspace:*
```

The package owns its Radix, Tailwind utility, and icon dependencies. It does not import from either app.

## Database

Only `apps/main` owns the D1 database:

- D1 binding: `DB`
- Wrangler config: `apps/main/wrangler.jsonc`
- Drizzle schema: `apps/main/lib/db/schema.ts`
- Drizzle config: `apps/main/drizzle.config.ts`
- Migrations: `apps/main/drizzle/`

Database commands can be run from the repository root:

```sh
pnpm run db:generate
pnpm run db:migrate:local
pnpm run db:migrate:remote
```

The local D1 database is separate from the remote Cloudflare D1 database. `--local` uses Wrangler's local emulator; `--remote` uses the configured database ID.

## Environment variables

Main-app Auth0 variables are loaded from `apps/main/.env` for local development. This file is ignored by Git. Configure the matching callback, logout, and web-origin URLs in Auth0 for `https://dev.flaggable.dev`.

The landing worker has a `MAIN_APP_URL` Wrangler variable pointing to `https://dev.flaggable.dev`. Change it when the landing site should link to production instead.

The main Worker uses Wrangler environments:

- Default deploy: `dev.flaggable.dev`.
- `production` deploy: `app.flaggable.dev`.

The production workflow is manually triggered and deploys with `--env production`. Create a GitHub environment named `production` and add the Cloudflare secrets there. Keep the development secrets as repository secrets, or move them to a separate `development` environment if you want approval and isolation.
