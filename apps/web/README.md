# apps/web

## Overview
What this package is
- The web frontend for the project built with Next.js and TypeScript.
- Uses shared/generated types from Convex (`_generated`) to keep client/server contracts consistent.

## High-level Structure
- `src/`
  - `app/` — Next.js routes
  - `components/` — UI components
  - `lib/` — client utilities, API wrappers
- `public/` — static files and images

## Development
- Always run commands for this web project from the web root.
- Install dependencies from the repo root:
  - `bun install`
- Use `bun add` to add packages to this project:
  - Regular dependecies: `bun add <package-name>`
  - Dev dependencies: `bun add <package-name> -d`
  - For shadcn/ui and other ui libraries compatible with their registry use: `bunx shadcn@latest add button` or `npx shadcn@latest add "https://motion-primitives.com/c/animated-group.json"`
- Build the project:
  - `bun build`

## Environment Variables
- Check `apps/web/.env.example` for required variables.

## Where to Get Help
- Check `packages/backend/convex` to understand server functions called by this frontend.
- Check `packages/data-ingestor` for how data is modeled/ingested.

## UI Libraries
- [Shadcn](https://ui.shadcn.com)
- [Motion Primitives](https://motion-primitives.com/docs/morphing-popover)
- [21st.dev](https://21st.dev/community/components)
- [Shadnc Studio](https://shadcnstudio.com/components)
- [Aceternity UI](https://ui.aceternity.com/components)
- ...
