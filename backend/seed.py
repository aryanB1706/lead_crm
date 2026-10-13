"""Seed LeadFlow dev DB with realistic demo data.

Usage:
  DATABASE_URL=... python seed.py          # skip if leads already exist
  DATABASE_URL=... python seed.py --reset  # TRUNCATE and reseed

Computes follow-ups relative to now (UTC) so demo always works:
  - 1 TODAY, 1 OVERDUE, 1 future, rest with no follow-up.
"""
import argparse
import datetime
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import sessionmaker

from app.models import Discussion, Lead, LeadStatus

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://leadflow:leadflow@localhost:5432/leadflow",
)


def build_rows(now: datetime.datetime):
    today = now  # due today in any tz (same instant)
    overdue = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=3)

    def days_ago(n: int, h: int = 10) -> datetime.datetime:
        return (now - datetime.timedelta(days=n)).replace(
            hour=h, minute=0, second=0, microsecond=0
        )

    return [
        {
            "name": "Aarti Sharma",
            "company": "Acme Corp",
            "phone": "+91-98200-11111",
            "status": LeadStatus.NEW,
            "follow_up_at": today,
            "discussions": [
                ("First call — asked for pricing deck.", days_ago(18)),
                ("Sent deck + intro email.", days_ago(9)),
                ("Followed up on WhatsApp, wants demo.", days_ago(2)),
            ],
        },
        {
            "name": "Rohan Mehta",
            "company": "Beta Ltd",
            "phone": "+91-98200-22222",
            "status": LeadStatus.CONTACTED,
            "follow_up_at": overdue,
            "discussions": [
                ("Cold call answered, busy — asked to call later.", days_ago(15)),
                ("Second call — showed interest in trial.", days_ago(4)),
            ],
        },
        {
            "name": "Priya Verma",
            "company": "Gamma Inc",
            "phone": "+91-98200-33333",
            "status": LeadStatus.QUALIFIED,
            "follow_up_at": future,
            "discussions": [
                ("Discovery call — 20 seats, budget approved.", days_ago(20)),
                ("Demo done with tech team.", days_ago(12)),
                ("Shared security questionnaire.", days_ago(6)),
                ("Legal review scheduled.", days_ago(1)),
            ],
        },
        {
            "name": "Kabir Singh Bedi",
            "company": "Delta Co",
            "phone": "+91-98200-44444",
            "status": LeadStatus.PROPOSAL_SENT,
            "follow_up_at": None,
            "discussions": [
                ("Proposal v1 sent for 15 seats.", days_ago(11)),
                ("Negotiating discount on annual plan.", days_ago(3)),
            ],
        },
        {
            "name": "Neha Gupta",
            "company": "Epsilon LLC",
            "phone": "+91-98200-55555",
            "status": LeadStatus.WON,
            "follow_up_at": None,
            "discussions": [
                ("Verbal yes on call.", days_ago(16)),
                ("PO received, onboarding kicked off.", days_ago(5)),
                ("Handover to success team.", days_ago(2)),
            ],
        },
        {
            "name": "Arjun Reddy",
            "company": "Zeta Systems",
            "phone": "+91-98200-66666",
            "status": LeadStatus.LOST,
            "follow_up_at": None,
            "discussions": [
                ("Demo done, liked UI.", days_ago(19)),
                ("Went with competitor on price.", days_ago(7)),
            ],
        },
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true")
    args = ap.parse_args()

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    now = datetime.datetime.now(datetime.timezone.utc)

    with Session() as s:
        if args.reset:
            s.execute(text("TRUNCATE discussions, leads RESTART IDENTITY CASCADE"))
            s.commit()
        else:
            count = s.execute(select(func.count()).select_from(Lead)).scalar()
            if count and count > 0:
                print(f"seed: {count} leads already exist, skipping (use --reset)")
                return

        rows = build_rows(now)
        # One transaction for all inserts.
        leads = []
        for r in rows:
            leads.append(
                Lead(
                    name=r["name"],
                    company=r["company"],
                    phone=r["phone"],
                    status=r["status"],
                    follow_up_at=r["follow_up_at"],
                )
            )
        s.add_all(leads)
        s.flush()  # assign ids

        discs = []
        for lead, r in zip(leads, rows):
            for note, created_at in r["discussions"]:
                discs.append(
                    Discussion(lead_id=lead.id, note=note, created_at=created_at)
                )
        s.add_all(discs)
        s.commit()

        n_leads = s.execute(select(func.count()).select_from(Lead)).scalar()
        n_discs = s.execute(select(func.count()).select_from(Discussion)).scalar()
        print(f"seed: {n_leads} leads, {n_discs} discussions")


if __name__ == "__main__":
    main()
