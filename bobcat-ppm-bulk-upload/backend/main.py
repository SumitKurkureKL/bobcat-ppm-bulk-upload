from dataclasses import dataclass

from fastapi import FastAPI

# Ensure .env is loaded before other modules that rely on environment variables
from dotenv import load_dotenv
load_dotenv()

from scripts.core.services.default import router


@dataclass
class FastAPIConfig:
    title: str = "Sample App"
    version: str = "1.0.0"
    description: str = "Sample App Description"


app = FastAPI(**FastAPIConfig().__dict__)
app.include_router(router)