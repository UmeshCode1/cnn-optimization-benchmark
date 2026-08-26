import sys
from pathlib import Path

# Ensure root workspace and backend directories are in Python path for test discovery
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
