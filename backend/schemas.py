from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum
from models import UserRole  

class UserRole(str, Enum):
    manager = "manager"
    employee = "employee"

class SentimentType(str, Enum):
    positive = "positive"
    neutral = "neutral"
    constructive = "constructive"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    manager_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    manager_id: Optional[str]
    
    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    employee_id: str
    strengths: str
    improvements: str
    sentiment: SentimentType
    tags: List[str] = []
    anonymous: bool = False

class FeedbackUpdate(BaseModel):
    employee_id: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    tags: Optional[List[str]] = None
    anonymous: Optional[bool] = None

class FeedbackAcknowledge(BaseModel):
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    giver_id: str
    receiver_id: str
    strengths: str
    improvements: str
    sentiment: SentimentType
    tags: List[str]
    anonymous: bool
    acknowledged: bool
    acknowledged_at: Optional[datetime]
    acknowledgment_comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    giver_name: str
    receiver_name: str
    giver_role: UserRole
    
    manager_id: Optional[str] = None
    employee_id: Optional[str] = None
    manager_name: Optional[str] = None
    employee_name: Optional[str] = None
    
    class Config:
        from_attributes = True