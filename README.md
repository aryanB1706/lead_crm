# LeadFlow — Single-Screen Lightweight CRM

LeadFlow is a lightweight CRM for a single sales rep. One screen, no routing:
a searchable/filterable lead list with today's follow-ups pinned on top,
a timeline dialog per lead (discussion history, status updates, new notes
with optional follow-ups), and an add-lead dialog.

## Features

- **Lead list** — name, company, status badge, last discussion note, "time ago".
  Filter by status (`New / Contacted / Qualified / Proposal Sent / Won / Lost`),
  debounced case-insensitive name search (`%` and `_` are escaped, not wildcards).
- **Today's follow-ups** — pinned section on top, sorted by time; pinned leads
  are never duplicated in the main list.
- **Overdue highlight** — red accent + "Overdue" label for past follow-ups
  (never for `Won`/`Lost`).
- **Timeline dialog (modal)** — full history newest-first, persistent status
  dropdown (optimistic update with rollback on failure), note form with optional
  follow-up datetime (local → UTC ISO). Saving a note with a follow-up updates
  the lead's `follow_up_at` and the list reflects it without a reload.
  Follow-ups can be cleared from the dialog.
- **Add-lead dialog** — name required (trimmed), company/phone optional,
  status defaults to `New`; new leads appear immediately and respect the
  active filter/search.
- **Bonus items** — search, overdue highlight, Docker Compose (db + backend +
  frontend), seed script (6 leads across all 6 statuses, 16 discussions),
  status filter chips.

## Tech Stack

| Layer    | Choice                                                                                   |
|----------|------------------------------------------------------------------------------------------|
| Frontend | Next.js (App Router) + JavaScript (`.js`/`.jsx`, no TypeScript) + Tailwind CSS + ESLint |
| Backend  | FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16 (`psycopg` 3 driver) + Pydantic v2    |
| Infra    | Docker + Docker Compose, `pytest` + `httpx` for API tests                                |

## Project Structure

```
lead_crm/
├── AGENTS.md               # persistent build context (read first)
├── docker-compose.yml      # db + backend + frontend
├── .env / .env.example     # Postgres credentials (never commit real secrets)
├── README.md
├── backend/
│   ├── Dockerfile / entrypoint.sh / .dockerignore
│   ├── requirements.txt / requirements-dev.txt / .env.example
│   ├── alembic.ini / alembic/          # migrations ONLY via Alembic
│   ├── seed.py                         # idempotent demo data (--reset to wipe)
│   ├── tests/                          # pytest suite (isolated test DB)
│   └── app/
│       ├── main.py         # app, CORS, /health, global {"detail"} errors
│       ├── database.py     # engine (pool_pre_ping) + get_db
│       ├── models.py       # Lead / Discussion (Identity PKs, TZ datetimes)
│       ├── schemas.py      # Pydantic v2 (UTC-Z datetimes, trimmed validation)
│       └── routers/leads.py
└── frontend/
    ├── Dockerfile / .dockerignore / .env.example
    └── src/
        ├── app/            # page.js (thin shell) + layout + globals
        ├── components/     # one small component per file
        └── lib/            # constants (+JSDoc typedefs), api client, time helpers
```

## Quickstart (Docker — recommended)

Requirements: Docker + Docker Compose.

```bash
cp .env.example .env   # defaults work out of the box
docker compose up --build -d
docker compose exec backend python seed.py --reset
```

- App: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/health (`{"status":"ok"}`, `503` if DB is down)

```bash
docker compose ps          # db + backend healthy
docker compose logs -f backend
docker compose down        # stop (keeps data); `down -v` wipes the database
```

> If host port `8000` is taken, run with `BACKEND_PORT=8001
> NEXT_PUBLIC_API_URL=http://localhost:8001 docker compose up --build -d`
> (the browser bundle is baked with that URL at build time).
> If host port `5432` is taken, the Compose file already maps `5433:5432`.

## Manual Setup (without Docker images)

Requirements: Python 3.12 + Node 20, plus a Postgres 16 reachable
(the Compose `db` service works fine for this).

```bash
# 1. Database
docker compose up -d db

# 2. Backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
export DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow
export CORS_ORIGINS=http://localhost:3000
alembic upgrade head
uvicorn app.main:app --reload --port 8000   # dev default; use 8002 if 8000 is busy
```

```bash
# 3. Frontend (new terminal, repo root)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev   # http://localhost:3000
```

## Seed Data

```bash
cd backend
DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow python seed.py --reset
```

- Without `--reset`, the script skips when leads already exist (idempotent).
- 6 realistic leads (one per status), 2–4 discussions each spread over the
  last 3 weeks, all in a single transaction.
- Follow-ups are computed relative to now (UTC) so the demo always works:
  one due **today**, one **overdue**, one **future**, rest with none.

## Running Tests

```bash
cd backend
. .venv/bin/activate                        # includes pytest + httpx
TEST_DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow_test \
  pytest tests -v
```

Tests run **only** against the separate `leadflow_test` database (created +
migrated automatically, truncated between tests). The dev database is never
touched. Covered: create (201), blank/missing name (422), default `New`,
status filter + `ILIKE` search incl. `%`/`_` escaping, missing lead (404),
status patch persistence + follow-up clearing, discussion creation updating
`follow_up_at`, empty note (422), newest-first ordering, delete cascade.

## Migrations

Schema changes **only** through Alembic — never `Base.metadata.create_all`
in app code.

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow
alembic revision --autogenerate -m "describe the change"
# review the file: indexes, FK ON DELETE CASCADE, status CHECK constraint
alembic upgrade head
```

## API Reference

Base URL `http://localhost:8000`. Errors always look like
`{"detail": "..."}`. Datetimes are ISO 8601 UTC strings ending in `Z`.
Field names are `snake_case` end to end
(`follow_up_at`, `last_note`, `last_discussion_at`, `created_at`).

| Method | Endpoint                          | Codes | Notes                                                        |
|--------|-----------------------------------|-------|--------------------------------------------------------------|
| GET    | `/health`                         | 200, 503 | `SELECT 1` probe; 503 `{"detail"}` when DB is down        |
| GET    | `/api/leads?status=&search=`      | 200, 422 | `last_note`/`last_discussion_at` via one `DISTINCT ON` join (no N+1); bad `status` → 422 |
| POST   | `/api/leads`                      | 201, 422 | `{name*, company?, phone?}`; name trimmed, status → `New`  |
| GET    | `/api/leads/{id}`                 | 200, 404 |                                                              |
| PATCH  | `/api/leads/{id}`                 | 200, 404, 422 | `{status?, name?, company?, phone?, follow_up_at?}`; `null` clears follow-up; bumps `updated_at` |
| GET    | `/api/leads/{id}/discussions`     | 200, 404 | newest first                                                |
| POST   | `/api/leads/{id}/discussions`     | 201, 404, 422 | `{note*, follow_up_at?}`; blank note → 422; follow-up applied to the lead in the same transaction |

## Design Decisions

- **Postgres + Alembic** — identity PKs, `TIMESTAMPTZ` everywhere,
  explicit `CHECK (status IN (...))` on a `VARCHAR` column
  (`Enum(native_enum=False)`), FK `ON DELETE CASCADE`, indexes on
  `leads(status)`, `leads(follow_up_at)`, `discussions(lead_id, created_at DESC)`
  and `lower(name)` for case-insensitive search; every schema change is a
  reviewed migration.
- **UTC storage, local-time display** — the API stores/returns
  timezone-aware UTC (`Z` suffix); "today" and "overdue" are computed in the
  user's local timezone on the frontend (`isToday`/`isOverdue`), refreshed by
  a 60-second timer so midnight rollover stays correct.
- **Single-query list** — `last_note`/`last_discussion_at` come from one
  `LEFT JOIN` against a `DISTINCT ON (lead_id)` subquery ordered by
  `created_at DESC` (no N+1); search uses bound `ILIKE … ESCAPE '\'` with
  `%`/`_` escaped in Python.
- **Thin frontend layers** — statuses/colors + JSDoc typedefs in
  `lib/constants.js`, all HTTP in `lib/api.js` (`ApiError` carries backend
  `detail` + status), pure date helpers in `lib/time.js`, one small component
  per file.
