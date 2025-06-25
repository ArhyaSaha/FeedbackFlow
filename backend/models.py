from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from pydantic_core import core_schema
from typing import Any
from bson import ObjectId
import enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None): 
        if isinstance(v, ObjectId):
            return str(v)  
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId format")

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserRole(str, enum.Enum):
    manager = "manager"
    employee = "employee"

class SentimentType(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    constructive = "constructive"

class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    full_name: str
    role: UserRole
    manager_id: Optional[PyObjectId] = None
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Feedback(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    manager_id: PyObjectId
    employee_id: PyObjectId
    strengths: str
    improvements: str
    sentiment: SentimentType
    tags: List[str] = Field(default_factory=list)  
    anonymous: bool = False 
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledgment_comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserDB:
    @staticmethod
    async def create_user(user_data: dict) -> User:
        from database import get_database
        db = get_database()
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        result = await db.users.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return User(**user_data)

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[User]:
        from database import get_database
        db = get_database()
        user_data = await db.users.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None

    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[User]:
        from database import get_database
        db = get_database()

        print(f"get_user_by_id called with user_id: {ObjectId(user_id)}, type: {type(user_id)}")
        
        if not ObjectId.is_valid(user_id):
            print(f"Invalid ObjectId format: {user_id}")
            return None
        
        try:
            user_data = await db.users.find_one({"_id": ObjectId(user_id)})
            if user_data:
                print(f"User found: {user_data.get('full_name', 'Unknown')}")
                return User(**user_data)
            else:
                print(f"No user found with id: {user_id}")
                return None
        except InvalidId as e:
            print(f"InvalidId exception for {user_id}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error for {user_id}: {e}")
            return None

    @staticmethod
    async def get_team_members(manager_id: str) -> List[User]:
        from database import get_database
        db = get_database()
        cursor = db.users.find({"manager_id": ObjectId(manager_id)})
        team_members = []
        async for user_data in cursor:
            team_members.append(User(**user_data))
        return team_members
    
    @staticmethod
    async def update_user(user_id: str, update_data: dict) -> Optional[User]:
        from database import get_database
        db = get_database()
        result = await db.users.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            return User(**result)
        return None
    
    @staticmethod
    async def get_managers() -> List[User]:
        from database import get_database
        db = get_database()
        cursor = db.users.find({"role": "manager"})
        managers = []
        async for user_data in cursor:
            managers.append(User(**user_data))
        return managers

class FeedbackDB:
    @staticmethod
    async def create_feedback(feedback_data: dict) -> Feedback:
        from database import get_database
        db = get_database()
        feedback_data["created_at"] = datetime.utcnow()
        feedback_data["updated_at"] = datetime.utcnow()
        feedback_data["acknowledged"] = False
        result = await db.feedback.insert_one(feedback_data)
        feedback_data["_id"] = result.inserted_id
        return Feedback(**feedback_data)

    @staticmethod
    async def get_feedback_by_manager(manager_id: str) -> List[Feedback]:
        from database import get_database
        db = get_database()
        cursor = db.feedback.find({"manager_id": ObjectId(manager_id)}).sort("created_at", -1)
        feedback_list = []
        async for feedback_data in cursor:
            feedback_list.append(Feedback(**feedback_data))
        return feedback_list

    @staticmethod
    async def get_feedback_by_employee(employee_id: str) -> List[Feedback]:
        from database import get_database
        db = get_database()
        cursor = db.feedback.find({"employee_id": ObjectId(employee_id)}).sort("created_at", -1)
        feedback_list = []
        async for feedback_data in cursor:
            feedback_list.append(Feedback(**feedback_data))
        return feedback_list

    @staticmethod
    async def update_feedback(feedback_id: str, update_data: dict) -> Optional[Feedback]:
        from database import get_database
        db = get_database()
        update_data["updated_at"] = datetime.utcnow()
        result = await db.feedback.find_one_and_update(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_data},
            return_document=True
        )
        if result:
            return Feedback(**result)
        return None

    @staticmethod
    async def get_feedback_by_id(feedback_id: str) -> Optional[Feedback]:
        from database import get_database
        db = get_database()
        feedback_data = await db.feedback.find_one({"_id": ObjectId(feedback_id)})
        if feedback_data:
            return Feedback(**feedback_data)
        return None

    @staticmethod
    async def acknowledge_feedback(feedback_id: str, comment: Optional[str] = None) -> bool:
        from database import get_database
        db = get_database()
        update_data = {
            "acknowledged": True,
            "acknowledged_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        if comment:
            update_data["acknowledgment_comment"] = comment
            
        result = await db.feedback.update_one(
            {"_id": ObjectId(feedback_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0