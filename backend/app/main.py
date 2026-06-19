from app.database import SessionLocal
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models import Deployment
from app.ai_agent import parse_command
from app.celery_worker import trigger_deployment

app = FastAPI()

from app.models import Base
from app.database import engine

Base.metadata.create_all(bind=engine)

# ✅ Request model
class DeployRequest(BaseModel):
    cmd: str

# ✅ CORS setup (fixed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/deploy")
def deploy(cmd: str = Query(...)):

    from app.ai_agent import parse_command
    from app.celery_worker import trigger_deployment

    parsed = parse_command(cmd)

    # ✅ SAVE initial record
    db = SessionLocal()

    record = Deployment(
        component=parsed["component"],
        action=parsed["action"],
        status="started"
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # pass ID to celery
    trigger_deployment.delay(parsed, record.id)

    return {"message": "Triggered", "id": record.id}

@app.get("/deployments")
def get_deployments():

    from app.database import SessionLocal
    from app.models import Deployment

    db = SessionLocal()

    data = db.query(Deployment).order_by(Deployment.id.desc()).all()

    return data