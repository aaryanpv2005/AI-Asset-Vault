from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
import app.models
from app.routes import users, assets 

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Asset Vault API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(assets.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to AI Asset Vault API 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }