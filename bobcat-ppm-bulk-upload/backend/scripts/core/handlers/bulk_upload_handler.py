import json
from threading import Lock
from typing import List, Dict, Any,Optional
from typing import Tuple
from fastapi import HTTPException, Request
import numpy as np
import pandas as pd
import math
import httpx

from constants.getHierarchyFomWorkcenterName import GetHierarchy
from constants.json_encoder import encode_custom_jwt
from constants.app_configuration import settings
from utils.db.common_utils import get_product_id_by_name
from utils.db.postgres import get_pg_connection
from utils.logger import logger
from scripts.core.schemas.bulk_upload_schema import BulkUpload
lock = Lock()

MANDATORY_COLUMNS = {
    "product": {"material code", "name"},
    "idealcycletime": {"product", "work center", "ideal cycle time"},
}

class BulkUploadHandler:
    def __init__(self, project_id: str) -> None:
        self.project_id = project_id
        # Base URL configuration
        self.base_url = "https://datamosaix.dev.dt.bobcat.com"


    @staticmethod
    def inject_auth_token(headers: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Inject authentication token from environment into headers.
        UI does NOT provide headers.
        Token is read from .env (LOGIN_TOKEN).
        """
        if headers is None:
            headers = {}

        if settings.login_token:
            if "Authorization" not in headers:
                headers["login-token"] = f"{settings.login_token}"
                logger.debug("Injected auth token from environment")
            else:
                logger.debug("Authorization header already present, skipping injection")
        else:
            logger.warning("LOGIN_TOKEN not configured in environment")

        return headers


    def _validate_file(self, file_obj) -> None:
        if not file_obj.filename.lower().endswith((".xlsx", ".xls")):
            raise HTTPException(status_code=400, detail="Only Excel files are allowed")

    def _read_excel(self, file_obj) -> pd.DataFrame:
        df = pd.read_excel(file_obj.file)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty")
        return df

    def _validate_columns(self, df: pd.DataFrame, upload_type: str):
        if upload_type not in MANDATORY_COLUMNS:
            raise HTTPException(status_code=400, detail="Unsupported bulk upload type")

        excel_columns = {col.strip().lower() for col in df.columns}
        required_columns = MANDATORY_COLUMNS[upload_type]

        missing = required_columns - excel_columns
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing mandatory columns: {', '.join(missing)}",
            )
    def _normalize_df(self, df: pd.DataFrame) -> pd.DataFrame:
        df.columns = [col.strip().lower() for col in df.columns]
        return df

    def _extract_api_message(self, resp: httpx.Response) -> str:
        try:
            data = resp.json()
            if isinstance(data, dict):
                return (
                        data.get("message")
                        or data.get("detail")
                        or data.get("error")
                        or "Unknown response from Save Model service"
                )
        except ValueError:
            pass

        return resp.text.strip()

    async def _save_single_row(
        self,
        client: httpx.AsyncClient,
        upload_type: str,
        jwt_token_payload: str,
        cookies: Dict[str, Any],
    ) -> Tuple[bool, str]:

        url = f"{self.base_url}/model_mgmt/save/{upload_type}?schema=public"
        headers = self.inject_auth_token(
            {"Content-Type": "application/json"}
        )
        try:
            """ 
                This will hit the external save API for the provided payload. 
            """
            logger.info("Starting model_mgmt Save API")
            resp = await client.post(
                url=url,
                content=jwt_token_payload,
                headers=headers,
                cookies=cookies
            )
            logger.info(f"Core model_mgmt Save API response: {resp.status_code},  {resp.text}")
        except httpx.RequestError as exc:
            logger.error(f"HTTP error: {exc}")
            return False, str(exc)
        # ---- Parse response safely ----
        try:
            response_body = resp.json()
        except ValueError:
            return False, "Invalid response received from Save Model service."
        api_status = response_body.get("status", "")
        # Safely extract response message
        api_resp_msg = self._extract_api_message(resp)
        if resp.status_code in (200, 201) and api_status == "success":
            return True, api_resp_msg or "Model saved successfully."
        logger.error(f"Model Save failed | status_code={resp.status_code} | body={resp.text} | api_status={api_status}")
        return False, resp.text

    def _validate_mandatory_values(
            self,
            row: Dict[str, Any],
            upload_type: str
    ) -> Tuple[bool, str]:
        mandatory_columns = MANDATORY_COLUMNS[upload_type]
        for column in mandatory_columns:
            value = row.get(column)

            # None or missing key
            if value is None:
                return False, f"Mandatory field '{column}' is missing"

            # NaN (from pandas)
            if isinstance(value, float) and math.isnan(value):
                return False, f"Mandatory field '{column}' is empty"

            # Empty string
            if isinstance(value, str) and not value.strip():
                return False, f"Mandatory field '{column}' is empty"

        return True, "VALID"

    def _build_product_payload(
            self,
            row: Dict[str, Any],
            input_data: BulkUpload
    ) -> Dict[str, Any]:
        offline_dict = input_data.offline.model_dump()

        return {
            "type": "product",
            "material_code": row["material code"],
            "name": row["name"],
            "description": row.get("description", "") or "",
            "sku": row.get("sku", "") or "",
            "parent_product": row.get("parent product", "") or "",
            "is_child": row.get("is child", "") or "",
            "tag_category": row.get("tag category", []) or [],
            "parameters": row.get("parameters", []) or [],
            "sku_group": row.get("sku group", "") or "",
            "process": row.get("process", []) or [],
            "workcenter": row.get("workcenter", []) or [],
            "processorder": row.get("processorder", []) or [],
            "multi_select_dependent_length": (
                    row.get("multi select dependent length") or 0
            ),

            "schema": "public",
            "offline": offline_dict,
            "project_type": input_data.project_type,
            "tz": input_data.tz,
            "resolution": input_data.resolution,
            "project_id":input_data.project_id,
            "language": input_data.language,
            "user_id": input_data.user_id,
        }

    def _build_ideal_cycle_time_payload(
            self,
            row: Dict[str, Any],
            input_data: BulkUpload
    ) -> Dict[str, Any]:
        offline_dict = input_data.offline.model_dump()

        product_name = row.get("product")
        if not product_name:
            raise HTTPException(
                status_code=400,
                detail="Product name is missing in input row",
            )
        conn = get_pg_connection(input_data.project_id)
        try:
            product_id = get_product_id_by_name(
                conn=conn,
                product_name=product_name,
                schema="public",
            )
        finally:
            conn.close()
        if not product_id:
            raise HTTPException(
                status_code=404,
                detail=f"Product '{product_name}' not found",
            )
        logger.info(f"Product ID of {product_name} : {product_id}")
        hierarchy_client = GetHierarchy(input_data)
        asset_id = row.get("work center")
        hierarchy = hierarchy_client.get_hierarchy_from_asset(asset_id)

        return {
            "type": "idealcycletime",
            "product": product_id,
            "hierarchy": hierarchy,
            "ideal_cycle_time": row["ideal cycle time"],

            "schema": "public",
            "offline": offline_dict,
            "project_type": input_data.project_type,
            "tz": input_data.tz,
            "resolution": input_data.resolution,
            "project_id": input_data.project_id,
            "language": input_data.language,
            "user_id": input_data.user_id,
        }

    def _build_payload(
            self,
            upload_type: str,
            row: Dict[str, Any],
            input_data: BulkUpload
    ) -> Dict[str, Any]:
        logger.info(f"Start building payload for : {upload_type}")
        if upload_type == "product":
            return self._build_product_payload(row, input_data)

        if upload_type == "idealcycletime":
            return self._build_ideal_cycle_time_payload(row, input_data)

        raise HTTPException(status_code=400, detail="Unsupported upload type")


    async def save_bulk_upload(
            self, input_data: BulkUpload, file_obj
    ) -> Dict[str, Any]:

        upload_type = input_data.type.lower()

        self._validate_file(file_obj)
        df = self._normalize_df(self._read_excel(file_obj))
        self._validate_columns(df, upload_type)

        records = df.replace({np.nan: None}).to_dict(orient="records")

        success = 0
        failures: List[Dict[str, Any]] = []

        timeout = httpx.Timeout(settings.default_timeout)

        async with httpx.AsyncClient(
                timeout=timeout, verify=settings.verify_ssl
        ) as client:
            for idx, row in enumerate(records, start=1):
                logger.info("Processing row #{}...".format(idx), row)
                valid, reason = self._validate_mandatory_values(row, upload_type)
                if not valid:
                    failures.append(
                        {"row_number": idx, "error": reason}
                    )
                    continue

                raw_payload = self._build_payload(upload_type, row, input_data)
                try:
                    # Encode / encrypt payload
                    encrypted_payload = encode_custom_jwt(raw_payload)
                    logger.info(f"Encrypted payload : {encrypted_payload}")
                    cookie = {
                        "login-token": settings.login_token,  # From environment
                        "user_id": input_data.user_id,
                        "projectId": input_data.project_id,
                    }
                    # Calling External API (Core platform Save API)
                    saved, msg = await self._save_single_row(
                        client, upload_type, encrypted_payload, cookie
                    )
                except Exception as exc:
                    logger.exception(f"Unexpected error at row {idx}")
                    failures.append(
                        {   "row_number": idx,
                            "error": str(exc) })
                    continue
                if saved:
                    success += 1
                else:
                    failures.append(
                        {"row_number": idx, "error": msg}
                    )
            logger.info(
                f"Bulk upload completed | total={len(records)} "
                f"| success={success} | failed={len(failures)}"
            )

            # RAISE FAILURE
            if failures:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Bulk upload failed for one or more records",
                        "total_records": len(records),
                        "success_count": success,
                        "failure_count": len(failures),
                        "failures": failures,
                    },
                )

            #  Only reaches here if ALL rows succeeded
            return {
                "message" : "Bulk upload completed successfully",
                "total_records": len(records),
                "success_count": success,
                "failure_count": 0,
                "failures": [],
            }
