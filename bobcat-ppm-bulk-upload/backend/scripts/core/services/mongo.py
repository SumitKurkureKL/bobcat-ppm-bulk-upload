from fastapi import APIRouter, HTTPException, Query

from scripts.core.handlers.mongo import MongoHandler, InsertPayload, UpdatePayload

# Use a neutral router (no prefix). The parent module mounts it under /mongo.
router = APIRouter()


@router.get("/")
async def root():
    return await MongoHandler.root()


@router.post("/insert-raw-data/{database_name}/{collection_name}")
async def insert_raw_data(database_name: str, collection_name: str, payload: InsertPayload):
    try:
        return await MongoHandler.insert_raw_data(database_name, collection_name, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/databases")
async def list_databases():
    try:
        return await MongoHandler.list_databases()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{database_name}")
async def list_collections(database_name: str):
    try:
        return await MongoHandler.list_collections(database_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collection/{database_name}/{collection_name}/count")
async def get_collection_count(database_name: str, collection_name: str):
    try:
        return await MongoHandler.get_collection_count(database_name, collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collection/{database_name}/{collection_name}/data")
async def get_collection_data(
    database_name: str,
    collection_name: str,
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of documents to return"),
):
    try:
        return await MongoHandler.get_collection_data(database_name, collection_name, skip, limit)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-one/{database_name}/{collection_name}")
async def update_one_document(database_name: str, collection_name: str, payload: UpdatePayload):
    try:
        return await MongoHandler.update_one_document(database_name, collection_name, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-many/{database_name}/{collection_name}")
async def update_many_documents(database_name: str, collection_name: str, payload: UpdatePayload):
    try:
        return await MongoHandler.update_many_documents(database_name, collection_name, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collection/{database_name}/{collection_name}")
async def delete_collection(database_name: str, collection_name: str):
    try:
        return await MongoHandler.delete_collection(database_name, collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/database/{database_name}")
async def delete_database(database_name: str):
    try:
        return await MongoHandler.delete_database(database_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
