#!/bin/sh
# LeadFlow backend entrypoint: wait for Postgres, migrate, serve.
set -e

echo "Waiting for database..."
python - <<'EOF'
import os
import time
import urllib.parse

import psycopg

url = os.environ.get("DATABASE_URL", "")
# SQLAlchemy URL -> plain libpq parts (strip the +psycopg driver suffix).
parsed = urllib.parse.urlparse(url.replace("postgresql+psycopg", "postgresql"))
host = parsed.hostname or "db"
port = parsed.port or 5432
user = urllib.parse.unquote(parsed.username or "")
password = urllib.parse.unquote(parsed.password or "")
dbname = (parsed.path or "/").lstrip("/") or "leadflow"

for attempt in range(60):
    try:
        conn = psycopg.connect(
            host=host, port=port, user=user, password=password,
            dbname=dbname, connect_timeout=2,
        )
        conn.close()
        print("Database is ready.")
        break
    except Exception as exc:  # noqa: BLE001 - retry until timeout
        print(f"Database not ready (attempt {attempt + 1}/60): {exc}")
        time.sleep(2)
else:
    raise SystemExit("Database never became ready; aborting.")
EOF

echo "Running migrations..."
alembic upgrade head

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
