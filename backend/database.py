from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")


client: Optional[AsyncIOMotorClient] = None
database = None


sync_client: Optional[MongoClient] = None
sync_database = None

async def connect_to_mongo():
    
    global client, database, sync_client, sync_database
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client[DATABASE_NAME]
    
    sync_client = MongoClient(MONGODB_URL)
    sync_database = sync_client[DATABASE_NAME]
    
    await database.users.create_index("email", unique=True)
    await database.feedback.create_index([("manager_id", 1), ("employee_id", 1)])
    await database.feedback.create_index("created_at")

async def close_mongo_connection():
    global client, sync_client
    if client:
        client.close()
    if sync_client:
        sync_client.close()

def get_database():
    return database

def get_sync_database():
    return sync_database