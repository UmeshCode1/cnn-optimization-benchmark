"""
Database Migration: Add execution_mode and provenance columns.

This script adds new columns to existing tables WITHOUT dropping any data.
Safe to run on the production Render SQLite database or PostgreSQL.
"""

from sqlalchemy import text
from app.database.session import engine


MIGRATIONS = [
    # Experiment table additions
    "ALTER TABLE experiments ADD COLUMN execution_mode VARCHAR(8) DEFAULT 'DEMO'",
    "ALTER TABLE experiments ADD COLUMN execution_environment TEXT DEFAULT ''",
    "ALTER TABLE experiments ADD COLUMN measurement_capabilities_json TEXT DEFAULT '{}'",

    # ExperimentRun table additions
    "ALTER TABLE experiment_runs ADD COLUMN accuracy_provenance VARCHAR(32) DEFAULT 'SIMULATED'",
    "ALTER TABLE experiment_runs ADD COLUMN latency_provenance VARCHAR(32) DEFAULT 'SIMULATED'",
    "ALTER TABLE experiment_runs ADD COLUMN energy_provenance VARCHAR(32) DEFAULT 'ESTIMATED'",
    "ALTER TABLE experiment_runs ADD COLUMN execution_mode VARCHAR(8) DEFAULT 'DEMO'",
]


def run_migration():
    applied = 0
    skipped = 0

    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
                applied += 1
                print(f"  [Applied] {sql}")
            except Exception as e:
                err_str = str(e).lower()
                if "duplicate column" in err_str or "already exists" in err_str:
                    skipped += 1
                    print(f"  [Skipped] (already exists): {sql}")
                else:
                    print(f"  [Note] on: {sql}\n     {e}")

    print(f"\nMigration complete: {applied} applied, {skipped} skipped.")


if __name__ == "__main__":
    run_migration()

