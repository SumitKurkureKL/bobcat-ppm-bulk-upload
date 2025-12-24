import jwt
import json
from typing import Dict, List, Optional
import httpx
import time
from datetime import datetime, timedelta
from constants.app_configuration import settings
from utils.logger import logger


class GetHierarchy:
    """ Get hierarchy from asset/work center using project context."""

    TREE_SEARCH_URL = (
        "https://datamosaix.dev.dt.bobcat.com/hry/tags/tree_search")

    def __init__(self,input_data) -> None:
        """
            Initialize hierarchy input.
        """
        self.PROJECT_ID = input_data.project_id
        self.USER_ID = input_data.user_id
        self.LANGUAGE = input_data.language
        self.SECRET_KEY = "kliLensKLiLensKL"
        self.AUTH_TOKEN = settings.login_token
        self.verify_ssl = settings.verify_ssl
        self.TZ = input_data.tz
        self.PROJECT_TYPE = input_data.project_type
        self.SCHEMA = "public"

        self.COMMON_HEADERS = {"Content-Type": "application/json"}
        self.COMMON_COOKIES = {
            "login-token": settings.login_token,
            "user_id": input_data.user_id,
            "project_id": input_data.project_id,
        }
        self.HEADER = {"alg": "HS256", "typ": "JWT"}

    def jwt_wrap(self,payload: dict):
        """Encodes a payload into JWT using project settings."""
        return jwt.encode(payload, self.SECRET_KEY, algorithm="HS256", headers=self.HEADER)


    def api_post(self,url: str, jwt_payload: dict):
        """POST request with JWT body."""
        token = self.jwt_wrap(jwt_payload)
        with httpx.Client(verify=self.verify_ssl, headers=self.COMMON_HEADERS, cookies=self.COMMON_COOKIES) as client:
            return client.post(url, content=token)

    # ==========================================
    # HIERARCHY FETCH (TREE SEARCH) BASED ON WORKCENTER NAME (SAPID) EX:
    # ==========================================
    def is_leaf(self, node: dict) -> bool:
        return not node.get("children")

    def get_first_innermost_record(self, tree_view: list):
        """Depth-first find the first leaf node."""
        if not tree_view:
            return None
        stack = list(reversed(tree_view))
        while stack:
            node = stack.pop()
            if self.is_leaf(node):
                return node
            children = node.get("children") or []
            stack.extend(reversed(children))
        return None

    def fetch_hierarchy_tree(self,search_text: str) -> List[Dict]:
        payload = {
            "search_string": search_text,
            "page_type": "assets",
            "project_id": self.PROJECT_ID ,
            "project_type": self.PROJECT_TYPE,
            "language": self.LANGUAGE,
            "user_id": self.USER_ID,
            "tz": self.TZ,
            "resolution": "lg",
            "offline": {"timestamp": int(time.time() * 1000)}
        }
        response = self.api_post(self.TREE_SEARCH_URL, jwt_payload=payload)
        if response.status_code != 200:
            logger.info("Failed to fetch hierarchy tree", response.text)
            return []

        return response.json().get("data", {}).get("tree_view", [])

    def get_hierarchy_from_asset(self, sap_id: str) -> str:
        """Get hierarchy string from AssetID or work center."""
        logger.info(f"Getting hierarchy from asset {sap_id}")
        if not sap_id:
            return "Provide sap_id"

        tree = self.fetch_hierarchy_tree(sap_id)
        leaf = self.get_first_innermost_record(tree)
        if not leaf:
            logger.error(f"Failed to fetch hierarchy tree for asset {sap_id}")
            return ""

        hierarchy = leaf.get("hierarchy", "")
        logger.info(f"Found hierarchy for {sap_id} : {hierarchy}")
        return hierarchy
