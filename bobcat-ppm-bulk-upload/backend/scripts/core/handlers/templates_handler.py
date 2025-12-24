
# Path: scripts/core/handlers/templates_handler.py
import os
from fastapi import HTTPException
from fastapi.responses import FileResponse
from utils.logger import logger


class TemplateHandler:
    """
    Handles template download operations
    """

    @staticmethod
    def get_product_template() -> FileResponse:
        try:
            file_path = "templates/create_product_template.xlsx"

            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404, detail="Product template not found"
                )

            return FileResponse(
                path=file_path,
                filename="create_product_template.xlsx",
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to get product template")
            raise HTTPException(
                status_code=500, detail="Unable to download product template"
            ) from exc

    @staticmethod
    def get_ideal_cycle_template() -> FileResponse:
        try:
            file_path = "templates/create_ideal_cycle_template.xlsx"

            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404, detail="Ideal cycle template not found"
                )

            return FileResponse(
                path=file_path,
                filename="create_ideal_cycle_template.xlsx",
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to get ideal cycle template")
            raise HTTPException(
                status_code=500, detail="Unable to download ideal cycle template"
            ) from exc
