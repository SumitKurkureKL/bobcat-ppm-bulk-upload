# scripts/utils/db/postgres.py

import psycopg2
from psycopg2.extensions import connection
from urllib.parse import urlparse, urlunparse
from constants.app_configuration import settings
from utils.logger import logger


class PostgresConnectionManager:
    """
    PostgreSQL connection manager.

    Base URI comes from Settings.postgres_uri
    DB name format:
        <project_id>__unified_model
    """

    def __init__(self, project_id: str) -> None:
        self.project_id = project_id
        self.db_name = f"{project_id}__unified_model"
        self.base_uri = settings.postgres_uri

    def _build_db_uri(self) -> str:
        parsed = urlparse(self.base_uri)
        return urlunparse(parsed._replace(path=f"/{self.db_name}"))

    def get_connection(self) -> connection:
        db_uri = self._build_db_uri()

        try:
            logger.info(
                "Connecting to PostgreSQL | db=%s host=%s",
                self.db_name,
                urlparse(db_uri).hostname,
            )
            return psycopg2.connect(db_uri)

        except Exception as exc:
            logger.exception(
                "PostgreSQL connection failed | db=%s", self.db_name
            )
            raise RuntimeError(
                f"Database connection failed for {self.db_name}"
            ) from exc


def get_pg_connection(project_id: str) -> connection:
    """
    Helper method to get PostgreSQL connection.
    """
    manager = PostgresConnectionManager(project_id=project_id)
    return manager.get_connection()
