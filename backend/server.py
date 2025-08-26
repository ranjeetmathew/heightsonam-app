from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "onam_celebration_secret_key_2025"
ALGORITHM = "HS256"

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key in ['created_at', 'event_date']:
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Models
class Admin(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str
    logo_url: Optional[str] = None
    total_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Member(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # Adult or Kid
    team_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    event_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Result(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    winner_team_id: str
    runner_up_team_id: Optional[str] = None
    winner_points: int = 10
    runner_up_points: int = 5
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PointsConfig(BaseModel):
    winner_points: int = 10
    runner_up_points: int = 5

# Auth functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize default data
@app.on_event("startup")
async def startup_event():
    # Create default admin
    admin_exists = await db.admins.find_one({"username": "admin"})
    if not admin_exists:
        admin_data = {
            "username": "admin",
            "password": get_password_hash("admin123")
        }
        await db.admins.insert_one(admin_data)
    
    # Create default teams
    teams_count = await db.teams.count_documents({})
    if teams_count == 0:
        default_teams = [
            {
                "id": str(uuid.uuid4()),
                "name": "Team Maveli",
                "color": "#FF6B35",
                "total_points": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Team Vamanan",
                "color": "#4ECDC4",
                "total_points": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.teams.insert_many(default_teams)
    
    # Create default points config
    config_exists = await db.points_config.find_one({})
    if not config_exists:
        await db.points_config.insert_one({"winner_points": 10, "runner_up_points": 5})

# Auth endpoints
@api_router.post("/auth/login")
async def login(admin_data: AdminLogin):
    admin = await db.admins.find_one({"username": admin_data.username})
    if not admin or not verify_password(admin_data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": admin_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Team endpoints
@api_router.get("/teams", response_model=List[Team])
async def get_teams():
    teams = await db.teams.find().to_list(length=None)
    return [Team(**parse_from_mongo(team)) for team in teams]

@api_router.post("/teams", response_model=Team)
async def create_team(team_data: Team, current_admin: str = Depends(get_current_admin)):
    team_dict = prepare_for_mongo(team_data.dict())
    await db.teams.insert_one(team_dict)
    return team_data

# Member endpoints
@api_router.get("/members", response_model=List[Member])
async def get_members():
    members = await db.members.find().to_list(length=None)
    return [Member(**parse_from_mongo(member)) for member in members]

@api_router.get("/members/team/{team_id}", response_model=List[Member])
async def get_members_by_team(team_id: str):
    members = await db.members.find({"team_id": team_id}).to_list(length=None)
    return [Member(**parse_from_mongo(member)) for member in members]

@api_router.post("/members", response_model=Member)
async def create_member(member_data: Member, current_admin: str = Depends(get_current_admin)):
    member_dict = prepare_for_mongo(member_data.dict())
    await db.members.insert_one(member_dict)
    return member_data

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, current_admin: str = Depends(get_current_admin)):
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}

# Event endpoints
@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find().sort("event_date", 1).to_list(length=None)
    return [Event(**parse_from_mongo(event)) for event in events]

@api_router.post("/events", response_model=Event)
async def create_event(event_data: Event, current_admin: str = Depends(get_current_admin)):
    event_dict = prepare_for_mongo(event_data.dict())
    await db.events.insert_one(event_dict)
    return event_data

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: Event, current_admin: str = Depends(get_current_admin)):
    event_dict = prepare_for_mongo(event_data.dict())
    result = await db.events.replace_one({"id": event_id}, event_dict)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_data

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_admin: str = Depends(get_current_admin)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Results endpoints
@api_router.get("/results", response_model=List[Result])
async def get_results():
    results = await db.results.find().to_list(length=None)
    return [Result(**parse_from_mongo(result)) for result in results]

@api_router.post("/results", response_model=Result)
async def create_result(result_data: Result, current_admin: str = Depends(get_current_admin)):
    # Update team points
    await db.teams.update_one(
        {"id": result_data.winner_team_id},
        {"$inc": {"total_points": result_data.winner_points}}
    )
    
    if result_data.runner_up_team_id:
        await db.teams.update_one(
            {"id": result_data.runner_up_team_id},
            {"$inc": {"total_points": result_data.runner_up_points}}
        )
    
    result_dict = prepare_for_mongo(result_data.dict())
    await db.results.insert_one(result_dict)
    return result_data

# Points config endpoints
@api_router.get("/points-config", response_model=PointsConfig)
async def get_points_config():
    config = await db.points_config.find_one({})
    if not config:
        return PointsConfig()
    return PointsConfig(**config)

@api_router.put("/points-config", response_model=PointsConfig)
async def update_points_config(config_data: PointsConfig, current_admin: str = Depends(get_current_admin)):
    await db.points_config.replace_one({}, config_data.dict(), upsert=True)
    return config_data

# Scoreboard endpoint
@api_router.get("/scoreboard")
async def get_scoreboard():
    teams = await db.teams.find().sort("total_points", -1).to_list(length=None)
    return [{"id": team["id"], "name": team["name"], "color": team["color"], "total_points": team["total_points"]} for team in teams]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()