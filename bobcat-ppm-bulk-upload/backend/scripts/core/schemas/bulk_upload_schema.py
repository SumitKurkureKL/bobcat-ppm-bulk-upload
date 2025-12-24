from typing import Optional, Dict
from pydantic import BaseModel, model_validator

class OfflineInfo(BaseModel):
    timestamp: int

class BulkUpload(BaseModel):
    offline: OfflineInfo
    type: str
    project_type: str
    tz: Optional[str]
    resolution: str
    project_id: str
    language: str
    user_id: str