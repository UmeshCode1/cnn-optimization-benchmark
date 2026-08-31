import sys
from pathlib import Path
import pytest

# Ensure root workspace and backend directories are in Python path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.session import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema is created, hardware profile bootstrapped, and seed data loaded before running tests."""
    init_db()
