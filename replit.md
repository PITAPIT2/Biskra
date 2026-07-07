# Pita Pit

A food ordering web app built with React + Vite (frontend) and Express + TypeScript (backend), organized as a pnpm monorepo.

## Architecture

| Package | Path | Description |
|---|---|---|
| `@workspace/pita-pit` | `pita-pit/` | React 18 + Vite frontend |
| `@workspace/api-server` | `api-server/` | Express 5 + TypeScript API |
| `@workspace/db` | `lib/db/` | Drizzle ORM schema/client (stub — no DB connected yet) |
| `@workspace/api-zod` | `lib/api-zod/` | Shared Zod validation schemas |
| `@workspace/api-client-react` | `lib/api-client-react/` | Typed React query hooks (stub) |

## Running the project

Two workflows are configured:

- **Start application** — Vite dev server for the frontend on port 5000  
  `PORT=5000 pnpm --filter @workspace/pita-pit run dev`

- **API Server** — Express API server on port 8080  
  `PORT=8080 pnpm --filter @workspace/api-server run dev`

## Environment variables

| Variable | Where set | Value |
|---|---|---|
| `BASE_PATH` | Shared env | `/` |
| `NODE_ENV` | Shared env | `development` |
| `PORT` | Inline in workflow command | `5000` (frontend), `8080` (API) |
| `SESSION_SECRET` | Replit Secret | (set) |
| `ADMIN_TOKEN` | Replit Secret | Required for admin API routes (`/api/orders` GET/PUT/DELETE, `/api/menu` POST/PUT) |
| `JSONBIN_BIN_ID` | Replit Secret | Optional — if set, menu data is persisted to JSONBin; otherwise falls back to seed data |
| `JSONBIN_API_KEY` | Replit Secret | Required when `JSONBIN_BIN_ID` is set |

## Notes

- The `lib/db` package is a stub — no database schema or connection is configured yet.
- The `lib/api-client-react` package is a stub — API hooks are not yet implemented.
- API routes exist for `/api/health`, `/api/menu`, and `/api/orders`.

## User preferences

- Run in Replit preview with both frontend and API server active.
