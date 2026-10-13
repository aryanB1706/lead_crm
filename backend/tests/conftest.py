"""Pytest fixtures: isolated leadflow_test DB, never touches dev DB."""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow_test",
)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _admin_url() -> str:
    # Same server, maintenance db `postgres` for CREATE DATABASE.
    if "/leadflow_test" in TEST_DATABASE_URL:
        return TEST_DATABASE_URL.replace("/leadflow_test", "/postgres")
    return TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"


def _ensure_test_db():
    admin_engine = create_engine(_admin_url(), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname='leadflow_test'")
        ).first()
        if not exists:
            conn.execute(text("CREATE DATABASE leadflow_test"))
    admin_engine.dispose()


def _upgrade_test_db():
    # Run alembic migrations against the TEST db only.
    from alembic.command import upgrade
    from alembic.config import Config

    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    upgrade(cfg, "head")


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    _ensure_test_db()
    _upgrade_test_db()
    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(setup_test_db):
    engine = setup_test_db
    # Isolation: truncate before each test.
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE discussions, leads RESTART IDENTITY CASCADE"))
        conn.commit()
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    from app.database import get_db
    from app.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
