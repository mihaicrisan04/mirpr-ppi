# mirpr-ppi

- Monorepo that uses `bun` as the package manager at the repo root.
- Frontend: `apps/web` (Next.js)
- Backend: `packages/backend/convex` (Convex functions + schema)
- Data processor: `packages/data-ingestor` (UV application to process and upload data to Convex)


## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system


## Instalation

**Mac OS / Linux**:
```bash
brew install oven-sh/bun/bun

or

curl -fsSL https://bun.com/install | bash
```

**Windows**:
```bash
scoop install bun

or

powershell -c "irm bun.sh/install.ps1|iex"
```


## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Convex

Make sure you have a Convex account. If you don't have one, sign up at [https://convex.dev](https://convex.dev).

### 3. Run the Development Server

```bash
bun dev
```

**Important**: The first run will automatically set up Convex:
- You'll be prompted to log in to Convex (if not already logged in)
- You'll be asked to link to an existing Convex project or create a new one
- Convex will generate environment files with deployment configuration

### 4. Configure Environment Variables

**⚠️ Critical**: Even after Convex login, the web app, authentication, and AI features won't work until all environment variables are properly set.

1. Check each package's `.env.example` file for required variables:
   - `apps/web/.env.example`
   - `packages/backend/.env.example`

2. Set up your environment variables:
   - Copy `.env.example` to `.env.local` in each package
   - Fill in all required values (API keys, secrets, etc.)
   - For backend environment variables, push them to Convex deployment:
     ```bash
     cd packages/backend
     bunx convex env set ENV_KEY=VALUE
     ```

3. See package-specific READMEs for detailed environment setup instructions

### 5. Access the Application

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.


## Project Structure

```
mirpr-ppi/
├── apps/
│   ├── web/         # Frontend application (Next.js)
├── packages/
│   ├── backend/     # Convex backend functions and schema
│   ├── data-ingestor/     # UV Python data ingestion scripts
```

## Available Scripts

- `bun dev`: Start all applications in development mode (Web + Convex)
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the Convex backend
- `bun check-types`: Check TypeScript types across all apps (Web + Convex)

## Where to Go Next

For package-specific setup, environment variables, and commands, see:
- [`apps/web/README.md`](./apps/web/README.md) - Frontend setup and UI libraries
- [`packages/backend/README.md`](./packages/backend/README.md) - Convex backend and environment configuration
- [`packages/data-ingestor/README.md`](./packages/data-ingestor/README.md) - Data ingestion scripts
