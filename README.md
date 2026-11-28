# Team Task Tracker API

A REST API for managing projects and tasks. Registered users can create projects, add members by email, create and assign tasks, filter and sort task lists, and view task summaries.

## Tech stack

- Node.js with Express 5
- SQLite (via `better-sqlite3`), raw SQL, no ORM
- JWT authentication, passwords hashed with `bcryptjs`
- Jest and Supertest for tests

## Prerequisites

- Node.js 18 or newer
- npm

No database server is needed. SQLite runs from a local file.

## Setup

```bash
git clone <repository-url>
cd project-tracker
npm install
cp .env.example .env
npm run migrate
npm run dev
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

The server starts at `http://localhost:8000`. Check it with:

```bash
curl http://localhost:8000/health
```

Expected response: `{"status":"ok"}`

Use `npm start` instead of `npm run dev` to run without auto-reload.

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `8000` |
| `DB_PATH` | Path of the SQLite database file | `./dev.db` |
| `JWT_SECRET` | Secret used to sign tokens. Use a long random value | `change-me` |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |

`.env` is not committed. Copy `.env.example` and set your own values.

## Database

- Schema is in `db/schema.sql` (tables: `users`, `projects`, `project_members`, `tasks`).
- `npm run migrate` creates the tables. It is safe to run more than once.
- Foreign keys are enabled, and deleting a project also deletes its tasks and memberships.

SQLite was chosen because it needs no setup. In production, PostgreSQL would be preferred for concurrent writes, native enums and better scaling.

## Running tests

```bash
npm test
```

Tests use an in-memory SQLite database, so they never touch `dev.db`.

## Project structure

```
server.js            starts the server
src/
  app.js             express app, routes, error handlers
  routes/            HTTP layer: request validation and responses
  services/          business logic and permission rules
  repositories/      SQL queries
  middleware/        JWT authentication
db/                  schema.sql, connection, migrate script
tests/               Jest and Supertest tests
```

Each request flows through three layers: route, then service, then repository.