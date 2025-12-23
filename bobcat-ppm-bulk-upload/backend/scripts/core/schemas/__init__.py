from pydantic import BaseModel
class DownloadResource(BaseModel):
    file_name: str
