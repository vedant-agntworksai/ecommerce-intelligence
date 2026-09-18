# Ecommerce Intelligence

Unified ecommerce intelligence for Amazon, Walmart, Lowe's, and Home Depot.

## Core principles

- One UI for discovery, PDP collection, reviews, competitor discovery, analytics, and exports.
- Cost-optimized by default: local data freshness is checked before every Oxylabs request.
- Canonical products are separated from retailer listings.
- DuckDB is the persistent local-development database; PostgreSQL is the production database.
- Retailer-specific behavior is isolated behind adapters.
- Reviews are incremental and deduplicated.
- Competitor discovery searches the local canonical catalog before any retailer/Oxylabs request.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- DuckDB via `@duckdb/node-api`
- PostgreSQL via `pg`
- Next.js route handlers + database-backed worker queue

## Local setup

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Run the worker separately:

```bash
npm run worker
```

Default local database: `./data/ecommerce.duckdb`.

## Environment

Use `DB_ENGINE=duckdb` locally. For production use `DB_ENGINE=postgres` and set `DATABASE_URL`.

Oxylabs credentials are required only when a cache miss/stale resource actually needs a network refresh.

## Status

Initial production architecture is being implemented in this repository.
