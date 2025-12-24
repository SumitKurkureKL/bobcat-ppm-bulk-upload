from fastapi import APIRouter, Body, Depends, status, Query, UploadFile, File, Form, HTTPException
from scripts.api import BulkUploadEndPoints
from scripts.core.handlers.bulk_upload_handler import BulkUploadHandler
from scripts.core.handlers.templates_handler import TemplateHandler
from utils.logger import logger
from scripts.core.schemas.bulk_upload_schema import BulkUpload


bulk_upload_router = APIRouter(prefix=BulkUploadEndPoints.base, tags=["Bulk Upload Services"])

@bulk_upload_router.post(BulkUploadEndPoints.bulk_upload)
async def ppm_bulk_upload(
    upload_file: UploadFile = File(...),
    template_data: str = Form(...),
):
    """
       Bulk upload API.
       UI sends:
       - Excel file
       - JSON payload as string (Form field)
       """

    try:
        # 1. Parse & validate payload
        payload = BulkUpload.model_validate_json(template_data)
        logger.info(
            f"Bulk upload request received | type={payload.type} | project_id={payload.project_id}"
        )
        if not payload.project_id or not payload.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id and user_id are mandatory",
            )

        bulk_upload_handler = BulkUploadHandler(
            project_id=payload.project_id
        )
        logger.info("Starting Bulk Upload Service")
        handler_response =  await bulk_upload_handler.save_bulk_upload(input_data=payload, file_obj=upload_file)
        return handler_response
    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(f"Unexpected error during bulk upload: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save bulk upload",
        )


@bulk_upload_router.get(BulkUploadEndPoints.product_download_template)
async def product_download_template():
    """
    Download product sample template
    :return: Excel template file
    """
    try:
        return TemplateHandler.get_product_template()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            f"Unexpected error during downloading the product template: {exc}"
        )
        raise HTTPException(status_code=500, detail="Failed to download product template")


@bulk_upload_router.get(BulkUploadEndPoints.ideal_cycle_download_template)
async def ideal_cycle_time_template():
    """
    Download ideal cycle time sample template
    :return: Excel template file
    """
    try:
        return TemplateHandler.get_ideal_cycle_template()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            f"Unexpected error during downloading the ideal cycle template: {exc}"
        )
        raise HTTPException(
            status_code=500, detail="Failed to download ideal cycle template"
        )
