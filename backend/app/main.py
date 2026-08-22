from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
import app.models
from app.routes import users, assets
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.expiry_service import check_expiry_reminders

Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()


def run_expiry_check():

    db = SessionLocal()

    try:

        check_expiry_reminders(db)

    except Exception as e:

        print("Expiry reminder check failed:", e)

    finally:

        db.close()


scheduler.add_job(
    run_expiry_check,
    "interval",
    days=1,
    id="expiry_reminder_job",
    replace_existing=True
)

scheduler.start()

run_expiry_check()

app = FastAPI(
    title="AI Asset Vault API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ai-asset-vault.onrender.com",
        "https://ai-asset-vault.onrender.com/",
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