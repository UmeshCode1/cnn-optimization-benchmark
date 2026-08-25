"""
Hardware Profile API Endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database.session import get_db, detect_system_hardware
from ..database.models import HardwareProfile

router = APIRouter(prefix="/api/hardware", tags=["Hardware"])


@router.get("")
def get_hardware_profile(db: Session = Depends(get_db)):
    """Retrieve host system hardware telemetry profile."""
    profile = db.query(HardwareProfile).first()
    if not profile:
        profile = detect_system_hardware()
        db.add(profile)
        db.commit()
    return profile.to_dict()
