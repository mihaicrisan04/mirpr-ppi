# packages/backend

## Overview
What this package is
- The backend for the project built with Convex.
- Provides serverless functions, database schema, and real-time data synchronization.
- Uses TypeScript for type-safe server-side logic.
- Generates types (`_generated`) that are shared with the frontend to maintain type consistency.

## High-level Structure
- `convex/`
  - `schema.ts` — Database schema definitions
  - `auth.ts` & `auth.config.ts` — Authentication configuration (Better-Auth)
  - `http.ts` — HTTP endpoints
  - `*.ts` — Query, mutation, and action functions
  - `_generated/` — Auto-generated Convex types (do not edit manually)

## Development
- **Important**: Always `cd` into the backend directory before running Convex-specific commands:
  ```bash
  cd packages/backend
  ```

### Initial Setup
1. Make sure you have a Convex account at [https://convex.dev](https://convex.dev)

2. Login to Convex (from the backend directory):
   ```bash
   cd packages/backend
   bunx convex login
   ```

3. Initialize your Convex project:
   ```bash
   bunx convex dev --configure
   ```
   This will:
   - Create a new Convex project (or link to an existing one)
   - Generate a `.env.local` file with `CONVEX_DEPLOYMENT` and other Convex variables

### Installing Dependencies
- Install all dependencies from the **repo root**:
  ```bash
  bun install
  ```

- Add packages to the backend project specifically (deps that only the backend needs):
  1. Navigate to backend:
     ```bash
     cd packages/backend
     ```
  2. Add regular dependencies:
     ```bash
     bun add <package-name>
     ```
  3. Add dev dependencies:
     ```bash
     bun add <package-name> -d
     ```

### Running the Development Server
From the backend directory:
```bash
cd packages/backend
bun dev
```

Or from the repo root (runs all services):
```bash
bun dev
```

Or run only the backend:
```bash
bun dev:server
```

## Environment Variables
- After logging in, Convex provisions a `.env.local` file automatically with deployment configuration.
- **Important**: Any additional environment variables you manually add to `.env.local` must be pushed to the Convex deployment to actually work:
  ```bash
  cd packages/backend
  bunx convex env set ENV_KEY=VALUE
  ```
  Example:
  ```bash
  bunx convex env set OPENAI_API_KEY=sk-...
  bunx convex env set DATABASE_URL=postgres://...
  ```

- To view all environment variables in your deployment:
  ```bash
  bunx convex env list
  ```

- To remove an environment variable:
  ```bash
  bunx convex env unset ENV_KEY
  ```

- Check `packages/backend/.env.example` for required variables.

## Key Concepts

For detailed information about how Convex queries, mutations, and actions work, see [`convex/README.md`](./convex/README.md).

Quick overview:
- **Queries** — Read-only operations that are reactive and automatically update
- **Mutations** — Transactional operations that modify database state
- **Actions** — Non-deterministic operations that can call external APIs
- **Schema** — Define your database tables in `convex/schema.ts`

## Common Commands

### Development
```bash
cd packages/backend
```

```bash
bun dev
or 
bunx convex dev              # Start development server
```

### Deployment
```bash
cd packages/backend
bunx convex deploy           # Deploy to production the current state
```

### Environment Management
```bash
cd packages/backend
bunx convex env set KEY=VALUE    # Set environment variable
bunx convex env list             # List all environment variables
bunx convex env unset KEY        # Remove environment variable
```

### Data Management
```bash
cd packages/backend
bunx convex data                 # Open data browser
bunx convex import               # Import data
bunx convex export               # Export data
```

### Dashboard
```bash
cd packages/backend
bunx convex dashboard            # Open Convex dashboard in browser
```

## Authentication
This project uses Better-Auth integrated with Convex. Configuration is in:
- `convex/auth.config.ts` — Better-Auth configuration
- `convex/auth.ts` — Auth setup and exports

## Where to Get Help
- [Convex Documentation](https://docs.convex.dev)
- [Convex Discord](https://convex.dev/community)
- Check `apps/web` to see how the frontend calls these backend functions
- Check `packages/data-ingestor` for data ingestion scripts

## Project Dependencies
- **Convex** — Backend platform
- **Better-Auth** — Authentication
- **AI SDK** — AI/LLM integration (@ai-sdk/openai, ai)
- **Convex Agent** — Agent framework for Convex

## Tips
- Use `bunx convex logs` to view real-time logs from your functions
- The Convex dashboard provides a visual interface for viewing data, logs, and function performance
- Generated types in `_generated/` are automatically updated when you modify your schema or functions
- Always test mutations and actions thoroughly — they can modify data or call external services
