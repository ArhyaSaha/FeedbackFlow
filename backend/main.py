from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from passlib.context import CryptContext
import os
from typing import Optional, List
from bson import ObjectId

from database import connect_to_mongo, close_mongo_connection
from models import User, Feedback, UserDB, FeedbackDB, UserRole, SentimentType
from schemas import UserCreate, UserLogin, UserResponse, FeedbackCreate, FeedbackResponse, FeedbackUpdate, FeedbackAcknowledge
from auth import create_access_token, verify_token, get_current_user

app = FastAPI(title="Feedback App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    expose_headers=["*"],
    max_age=600,  
)

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing_user = await UserDB.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    hashed_password = pwd_context.hash(user.password)
    user_data = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "manager_id": ObjectId(user.manager_id) if user.manager_id else None,
        "hashed_password": hashed_password
    }
    
    db_user = await UserDB.create_user(user_data)
    
    return UserResponse(
        id=str(db_user.id),
        email=db_user.email,
        full_name=db_user.full_name,
        role=db_user.role,
        manager_id=str(db_user.manager_id) if db_user.manager_id else None
    )

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await UserDB.get_user_by_email(user.email)
    
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=str(db_user.id),
            email=db_user.email,
            full_name=db_user.full_name,
            role=db_user.role,
            manager_id=str(db_user.manager_id) if db_user.manager_id else None
        )
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        manager_id=str(current_user.manager_id) if current_user.manager_id else None
    )

@app.get("/api/team", response_model=List[UserResponse])
async def get_team_members(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.manager:
        team_members = await UserDB.get_team_members(str(current_user.id))
    elif current_user.role == UserRole.employee:
        if not current_user.manager_id:
            return []
        team_members = await UserDB.get_team_members(str(current_user.manager_id))
        team_members = [member for member in team_members if str(member.id) != str(current_user.id)]
    else:
        raise HTTPException(status_code=403, detail="Invalid user role")
    
    return [
        UserResponse(
            id=str(member.id),
            email=member.email,
            full_name=member.full_name,
            role=member.role,
            manager_id=str(member.manager_id) if member.manager_id else None
        )
        for member in team_members
    ]

@app.post("/api/feedback", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user)
):
    employee = await UserDB.get_user_by_id(feedback.employee_id)
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )
    
    if current_user.role == UserRole.manager:
        if str(employee.manager_id) != str(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You can only give feedback to your direct reports"
            )
    elif current_user.role == UserRole.employee:
        if str(employee.manager_id) != str(current_user.manager_id):
            raise HTTPException(
                status_code=403,
                detail="You can only give feedback to employees under the same manager"
            )
        if str(employee.id) == str(current_user.id):
            raise HTTPException(
                status_code=400,
                detail="You cannot give feedback to yourself"
            )
    
    feedback_data = {
        "manager_id": ObjectId(str(current_user.id)),
        "employee_id": ObjectId(feedback.employee_id),
        "strengths": feedback.strengths,
        "improvements": feedback.improvements,
        "sentiment": feedback.sentiment,
        "tags": feedback.tags
    }
    print(current_user.role)
    
    db_feedback = await FeedbackDB.create_feedback(feedback_data)
    
    return FeedbackResponse(
        id=str(db_feedback.id),
        giver_id=str(db_feedback.manager_id),
        receiver_id=str(db_feedback.employee_id),
        strengths=db_feedback.strengths,
        improvements=db_feedback.improvements,
        sentiment=db_feedback.sentiment,
        tags=db_feedback.tags,
        acknowledged=db_feedback.acknowledged,
        acknowledged_at=db_feedback.acknowledged_at,
        acknowledgment_comment=db_feedback.acknowledgment_comment,
        created_at=db_feedback.created_at,
        updated_at=db_feedback.updated_at,
        giver_name=current_user.full_name,
        receiver_name=employee.full_name,
        giver_role=current_user.role
    )

@app.get("/api/feedback", response_model=List[FeedbackResponse])
async def get_feedback(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.manager:
        feedback_list = await FeedbackDB.get_feedback_by_manager(str(current_user.id))
    else:
        feedback_list = await FeedbackDB.get_feedback_by_employee(str(current_user.id))
    
    result = []
    for feedback in feedback_list:
        manager = await UserDB.get_user_by_id(str(feedback.manager_id))
        print("Man",str(feedback.manager_id))
        employee = await UserDB.get_user_by_id(str(feedback.employee_id))
        print("Employee",str(feedback.employee_id))
        
        result.append(FeedbackResponse(
            id=str(feedback.id),
            giver_id=str(feedback.manager_id),  
            receiver_id=str(feedback.employee_id),  
            strengths=feedback.strengths,
            improvements=feedback.improvements,
            sentiment=feedback.sentiment,
            tags=feedback.tags,
            acknowledged=feedback.acknowledged,
            acknowledged_at=feedback.acknowledged_at,
            acknowledgment_comment=feedback.acknowledgment_comment,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            giver_name=manager.full_name if manager else "",  
            receiver_name=employee.full_name if employee else "",  
            giver_role=manager.role if manager else UserRole.employee  
        ))
    
    return result

@app.put("/api/feedback/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: str,
    feedback_update: FeedbackUpdate,
    current_user: User = Depends(get_current_user)
):
    db_feedback = await FeedbackDB.get_feedback_by_id(feedback_id)
    
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if str(db_feedback.manager_id) != str(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You can only update your own feedback"
        )

    update_data = {}
    if feedback_update.strengths is not None:
        update_data["strengths"] = feedback_update.strengths
    if feedback_update.improvements is not None:
        update_data["improvements"] = feedback_update.improvements
    if feedback_update.sentiment is not None:
        update_data["sentiment"] = feedback_update.sentiment
    if feedback_update.tags is not None:  
        update_data["tags"] = feedback_update.tags
    if feedback_update.employee_id is not None:  
        update_data["employee_id"] = ObjectId(feedback_update.employee_id)
    
    updated_feedback = await FeedbackDB.update_feedback(feedback_id, update_data)
    
    if not updated_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    employee = await UserDB.get_user_by_id(str(updated_feedback.employee_id))

    return FeedbackResponse(
        id=str(updated_feedback.id),
        giver_id=str(updated_feedback.manager_id),  
        receiver_id=str(updated_feedback.employee_id),  
        strengths=updated_feedback.strengths,
        improvements=updated_feedback.improvements,
        sentiment=updated_feedback.sentiment,
        tags=updated_feedback.tags,
        acknowledged=updated_feedback.acknowledged,
        acknowledged_at=updated_feedback.acknowledged_at,
        acknowledgment_comment=updated_feedback.acknowledgment_comment,
        created_at=updated_feedback.created_at,
        updated_at=updated_feedback.updated_at,
        giver_name=current_user.full_name if current_user else "",  
        receiver_name=employee.full_name if employee else "",  
        giver_role=current_user.role if current_user else UserRole.employee  
    )

@app.get("/api/feedback/received", response_model=List[FeedbackResponse])
async def get_received_feedback(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=403,
            detail="Only employees can access received feedback endpoint"
        )
    
    feedback_list = await FeedbackDB.get_feedback_by_employee(str(current_user.id))
    
    result = []
    for feedback in feedback_list:
        manager = await UserDB.get_user_by_id(str(feedback.manager_id))
        employee = await UserDB.get_user_by_id(str(feedback.employee_id))
        
        result.append(FeedbackResponse(
            id=str(feedback.id),
            giver_id=str(feedback.manager_id),  
            receiver_id=str(feedback.employee_id), 
            strengths=feedback.strengths,
            improvements=feedback.improvements,
            sentiment=feedback.sentiment,
            tags=feedback.tags,
            acknowledged=feedback.acknowledged,
            acknowledged_at=feedback.acknowledged_at,
            acknowledgment_comment=feedback.acknowledgment_comment,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            giver_name=manager.full_name if manager else "",  
            receiver_name=employee.full_name if employee else "",  
            giver_role=manager.role if manager else UserRole.employee  
        ))
    
    return result

@app.get("/api/feedback/given", response_model=List[FeedbackResponse])
async def get_given_feedback(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=403,
            detail="Only employees can access given feedback endpoint"
        )
    
    feedback_list = await FeedbackDB.get_feedback_by_manager(str(current_user.id))
    
    result = []
    for feedback in feedback_list:
        manager = await UserDB.get_user_by_id(str(feedback.manager_id))
        employee = await UserDB.get_user_by_id(str(feedback.employee_id))
        
        result.append(FeedbackResponse(
            id=str(feedback.id),
            giver_id=str(feedback.manager_id),  
            receiver_id=str(feedback.employee_id),  
            strengths=feedback.strengths,
            improvements=feedback.improvements,
            sentiment=feedback.sentiment,
            tags=feedback.tags,
            acknowledged=feedback.acknowledged,
            acknowledged_at=feedback.acknowledged_at,
            acknowledgment_comment=feedback.acknowledgment_comment,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            giver_name=manager.full_name if manager else "",  
            receiver_name=employee.full_name if employee else "",  
            giver_role=manager.role if manager else UserRole.employee  
        ))
    
    return result

@app.patch("/api/feedback/{feedback_id}/acknowledge")
async def acknowledge_feedback(
    feedback_id: str,
    acknowledge_data: FeedbackAcknowledge,
    current_user: User = Depends(get_current_user)
):
    db_feedback = await FeedbackDB.get_feedback_by_id(feedback_id)
    
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    
    if current_user.role != UserRole.employee or str(db_feedback.employee_id) != str(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You can only acknowledge your own feedback"
        )
    
    success = await FeedbackDB.acknowledge_feedback(feedback_id, acknowledge_data.comment)
    
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Feedback acknowledged successfully"}

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str, current_user: User = Depends(get_current_user)):
    
    user = await UserDB.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(current_user.id) or str(user.id) == str(current_user.manager_id):
        return UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            manager_id=str(user.manager_id) if user.manager_id else None
        )
    
    raise HTTPException(status_code=403, detail="Access denied")

@app.put("/api/auth/update-profile", response_model=UserResponse)
async def update_profile(
    profile_update: dict,
    current_user: User = Depends(get_current_user)
):
    
    allowed_fields = ["full_name", "email"]
    update_data = {k: v for k, v in profile_update.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    updated_user = await UserDB.update_user(str(current_user.id), update_data)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role,
        manager_id=str(updated_user.manager_id) if updated_user.manager_id else None
    )


@app.get("/api/managers", response_model=List[UserResponse])
async def get_managers(current_user: User = Depends(get_current_user)):
    managers = await UserDB.get_managers()
    return [
        UserResponse(
            id=str(manager.id),
            email=manager.email,
            full_name=manager.full_name,
            role=manager.role,
            manager_id=str(manager.manager_id) if manager.manager_id else None
        )
        for manager in managers
    ]


@app.put("/api/auth/update-manager", response_model=UserResponse)
async def update_manager(
    manager_update: dict,
    current_user: User = Depends(get_current_user)
):

    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=403,
            detail="Only employees can change their manager"
        )
    
    manager_id = manager_update.get("manager_id")
    
    if manager_id:
        manager = await UserDB.get_user_by_id(manager_id)
        if not manager:
            raise HTTPException(status_code=404, detail="Manager not found")
        
        if manager.role != UserRole.manager:
            raise HTTPException(status_code=400, detail="Selected user is not a manager")

    update_data = {
        "manager_id": ObjectId(manager_id) if manager_id else None,
        "updated_at": datetime.utcnow()
    }
    
    updated_user = await UserDB.update_user(str(current_user.id), update_data)
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(updated_user.id),
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role,
        manager_id=str(updated_user.manager_id) if updated_user.manager_id else None
    )

@app.get("/api/stats")
async def get_stats(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.manager:
        feedback_list = await FeedbackDB.get_feedback_by_manager(str(current_user.id))
        
        total = len(feedback_list)
        positive = len([f for f in feedback_list if f.sentiment == SentimentType.positive])
        neutral = len([f for f in feedback_list if f.sentiment == SentimentType.neutral])
        constructive = len([f for f in feedback_list if f.sentiment == SentimentType.constructive])
        acknowledged = len([f for f in feedback_list if f.acknowledged])
        
        return {
            "total": total,
            "positive": positive,
            "neutral": neutral,
            "constructive": constructive,
            "acknowledged": acknowledged
        }
    else:
        feedback_list = await FeedbackDB.get_feedback_by_employee(str(current_user.id))
        
        total = len(feedback_list)
        acknowledged = len([f for f in feedback_list if f.acknowledged])
        positive = len([f for f in feedback_list if f.sentiment == SentimentType.positive])
        pending = total - acknowledged
        
        return {
            "total": total,
            "acknowledged": acknowledged,
            "positive": positive,
            "pending": pending
        }
    
@app.post("/api/request-feedback")
async def request_feedback_from_manager(current_user: User = Depends(get_current_user)):
    """
    Send feedback request email to manager
    """
    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=403,
            detail="Only employees can request feedback from managers"
        )
    
    if not current_user.manager_id:
        raise HTTPException(
            status_code=400,
            detail="No manager assigned to your account"
        )
    
    # Get manager details
    manager = await UserDB.get_user_by_id(str(current_user.manager_id))
    if not manager:
        raise HTTPException(
            status_code=404,
            detail="Manager not found"
        )
    
    # Import email utility
    from email_utils import send_feedback_request_email
    
    # Send email
    email_sent = send_feedback_request_email(
        manager_email=manager.email,
        employee_name=current_user.full_name,
        manager_name=manager.full_name
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please try again later."
        )
    
    return {
        "message": f"Feedback request sent to {manager.full_name} successfully!",
        "manager_name": manager.full_name,
        "manager_email": manager.email
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)