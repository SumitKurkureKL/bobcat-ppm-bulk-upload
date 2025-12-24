import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv
from scripts.core.services.bulk_upload_service import bulk_upload_router
from utils.logger import setup_logger

# Load environment variables from .env file
load_dotenv()

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application starting up...")
    yield
    # Shutdown
    logger.info("Application shutting down...")


app = FastAPI(
    title="Bulk Upload Service",
    description="Upload Services",
    version="2.0.0",
    lifespan=lifespan,
)

# Register routers
app.include_router(bulk_upload_router)

if __name__ == "__main__":
    # Read configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    reload = os.getenv("APP_RELOAD", "false").lower() == "true"
    log_level = os.getenv("LOG_LEVEL", "info").lower()

    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level
    )