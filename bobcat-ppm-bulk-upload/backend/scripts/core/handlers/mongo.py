from typing import List, Dict, Any, Optional, Any as _Any
from pydantic import BaseModel
from datetime import datetime
try:
    from bson import ObjectId
except Exception:  # pragma: no cover - optional at static analysis time
    ObjectId = None
import os
from dotenv import load_dotenv

# Guard motor import so static analyzers don't error if package isn't installed in this environment
try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:  # pragma: no cover - optional at static analysis time
    AsyncIOMotorClient = _Any

# Load env
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Module-level Mongo client (lazy init)
client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    """Lazily create and return the AsyncIOMotorClient"""
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGO_URI)
    return client


class TranslationData(BaseModel):
    model_config = {"json_encoders": {datetime: lambda v: v.isoformat()}}

    languageId: str
    languageName: str
    translations: Dict[str, Any]
    direction: Optional[str] = None
    updatedAt: Optional[datetime] = None


class InsertPayload(BaseModel):
    data: List[Dict[str, Any]]


class UpdatePayload(BaseModel):
    filter: Dict[str, Any]
    update: Dict[str, Any]
    array_filters: Optional[List[Dict[str, Any]]] = None
    upsert: Optional[bool] = False


async def create_collection_if_not_exists(db, collection_name: str) -> bool:
    collections = await db.list_collection_names()
    if collection_name not in collections:
        await db.create_collection(collection_name)
        return True
    return False


def convert_objectid_in_filter(filter_dict: Dict[str, Any]) -> Dict[str, Any]:
    converted = {}
    for key, value in filter_dict.items():
        if key == "_id" and isinstance(value, str) and ObjectId is not None:
            try:
                converted[key] = ObjectId(value)
            except Exception:
                converted[key] = value
        elif isinstance(value, dict):
            converted[key] = convert_objectid_in_filter(value)
        elif isinstance(value, list):
            converted[key] = [convert_objectid_in_filter(item) if isinstance(item, dict) else item for item in value]
        else:
            converted[key] = value
    return converted


class MongoHandler:
    """Handler class exposing methods used by the router."""

    @staticmethod
    async def root() -> Dict[str, Any]:
        return {"message": "MongoDB FastAPI Integration", "status": "active"}

    @staticmethod
    async def insert_raw_data(database_name: str, collection_name: str, payload: InsertPayload) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]
        await create_collection_if_not_exists(db, collection_name)

        # Remove client-sent _id to let Mongo auto-generate
        for d in payload.data:
            d.pop("_id", None)

        result = await db[collection_name].insert_many(payload.data)

        return {
            "message": "Raw data inserted successfully",
            "inserted_count": len(result.inserted_ids),
            "database_name": database_name,
            "collection_name": collection_name,
            "inserted_ids": [str(id) for id in result.inserted_ids]
        }

    @staticmethod
    async def list_databases() -> Dict[str, Any]:
        db_client = get_client()
        db_list = await db_client.list_database_names()
        return {"databases": db_list, "count": len(db_list)}

    @staticmethod
    async def list_collections(database_name: str) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]
        collections = await db.list_collection_names()
        return {"database": database_name, "collections": collections, "count": len(collections)}

    @staticmethod
    async def get_collection_count(database_name: str, collection_name: str) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]
        count = await db[collection_name].count_documents({})
        return {
            "database_name": database_name,
            "collection_name": collection_name,
            "document_count": count
        }

    @staticmethod
    async def get_collection_data(database_name: str, collection_name: str, skip: int, limit: int) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]

        collections = await db.list_collection_names()
        if collection_name not in collections:
            raise ValueError(f"Collection '{collection_name}' not found in database '{database_name}'")

        cursor = db[collection_name].find({}).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)

        for doc in documents:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])

        total_count = await db[collection_name].count_documents({})

        return {
            "database_name": database_name,
            "collection_name": collection_name,
            "total_documents": total_count,
            "returned_documents": len(documents),
            "skip": skip,
            "limit": limit,
            "data": documents
        }

    @staticmethod
    async def update_one_document(database_name: str, collection_name: str, payload: UpdatePayload) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]

        filter_query = convert_objectid_in_filter(payload.filter)

        # Build explicit options
        upsert_flag = bool(payload.upsert)
        result = await db[collection_name].update_one(filter_query, payload.update, upsert=upsert_flag, array_filters=payload.array_filters if payload.array_filters else None)

        return {
            "message": "Document updated successfully",
            "database_name": database_name,
            "collection_name": collection_name,
            "matched_count": result.matched_count,
            "modified_count": result.modified_count,
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }

    @staticmethod
    async def update_many_documents(database_name: str, collection_name: str, payload: UpdatePayload) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]

        filter_query = convert_objectid_in_filter(payload.filter)

        upsert_flag = bool(payload.upsert)
        result = await db[collection_name].update_many(filter_query, payload.update, upsert=upsert_flag, array_filters=payload.array_filters if payload.array_filters else None)

        return {
            "message": "Documents updated successfully",
            "database_name": database_name,
            "collection_name": collection_name,
            "matched_count": result.matched_count,
            "modified_count": result.modified_count,
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }

    @staticmethod
    async def delete_collection(database_name: str, collection_name: str) -> Dict[str, Any]:
        db_client = get_client()
        db = db_client[database_name]
        await db.drop_collection(collection_name)
        return {"message": f"Collection '{collection_name}' deleted successfully from database '{database_name}'"}

    @staticmethod
    async def delete_database(database_name: str) -> Dict[str, Any]:
        db_client = get_client()
        await db_client.drop_database(database_name)
        return {"message": f"Database '{database_name}' deleted successfully"}
