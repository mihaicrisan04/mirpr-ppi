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
brew install bun

or

curl -fsSL https://bun.com/install | bash
```

**Windows**:
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```


## Getting Started

- First, install the dependencies:

```bash
bun install
```

- Second, make sure you have a Convex account. If you don't have one, sign up at [https://convex.dev](https://convex.dev).

- Third, set up project environment variables. (You can copy the `.env.example` file to `.env` and fill in the required values. You can ask me for the actual keys)

- Then, run the development server:

```bash
bun dev
```

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

Where to go next
- Open package READMEs for package-specific setup and commands:
  - `apps/web/README.md`
  - `packages/backend/convex/README.md`
  - `packages/data-ingestor/README.md`
