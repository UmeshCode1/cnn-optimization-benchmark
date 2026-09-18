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


@router.get("/devices")
def list_target_devices():
    """List supported target edge and wearable devices (mini watch, wearable MCU, Pi, Jetson, Smartphone)."""
    from ..services.device_hardware_service import DeviceHardwareService
    return DeviceHardwareService.get_all_device_profiles()


from pydantic import BaseModel, Field


class DeviceSimulationRequest(BaseModel):
    device_id: str = Field("mini-watch-smartwatch", description="Target hardware device identifier")
    flops_m: float = Field(250.0, gt=0.0, description="Model computational complexity in MFLOPs")
    parameters_m: float = Field(5.0, gt=0.0, description="Model parameters in millions")
    model_size_mb: float = Field(12.0, gt=0.0, description="Model footprint in Megabytes")
    accuracy: float = Field(92.5, ge=0.0, le=100.0, description="Top-1 accuracy percentage")
    quantization_type: str = Field("INT8", description="Quantization precision (FP32, FP16, INT8, INT4)")
    ambient_temp_c: float = Field(25.0, description="Ambient operating environment temperature in °C")
    continuous_inference_duration_s: float = Field(60.0, description="Inference interval for thermal saturation")


@router.post("/simulate-device")
def simulate_device_deployment(req: DeviceSimulationRequest):
    """
    Simulate real physical metrics on target edge/wearable device:
    - Latency & FPS (Roofline)
    - Active & Idle Power (mW)
    - Energy per inference (mJ / uJ)
    - Temperature Rise & Heat Dissipation (ΔT and Operating Surface Temperature)
    - Wearable Skin Safety (IEC 62368-1 limit 43°C)
    - Battery Continuous Runtime
    - Thermal Saturation Curve T(t)
    """
    from ..services.device_hardware_service import DeviceHardwareService
    return DeviceHardwareService.simulate_device_deployment(
        device_id=req.device_id,
        flops_m=req.flops_m,
        parameters_m=req.parameters_m,
        model_size_mb=req.model_size_mb,
        accuracy=req.accuracy,
        quantization_type=req.quantization_type,
        ambient_temp_c=req.ambient_temp_c,
        continuous_inference_duration_s=req.continuous_inference_duration_s,
    )

