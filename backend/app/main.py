from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.models import Project, Deployment
from app.celery_worker import trigger_deployment
from app.ai_agent import parse_command
import json

from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,

    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ LOGIN
@app.post("/login")
def login(username: str, password: str):
    if username == "manager" and password == "manager123":
        return {"msg": "success"}
    return {"msg": "failed"}


# ✅ CREATE PROJECT
@app.post("/create_project")
def create_project(data: dict):

    db = SessionLocal()

    project = Project(
        name=data["name"],
        repo=data["repo"],
        type=data["type"],
        
        workflows=json.dumps(data["workflows"])

    )

    db.add(project)
    db.commit()

    return {"msg":"created"}


# ✅ GET PROJECTS
@app.get("/projects")
def get_projects():
    db = SessionLocal()
    try:
        return db.query(Project).all()
    finally:
        db.close()

# ✅ SAVE WORKFLOW CONFIG
@app.post("/save_workflow")
def save_workflow(project_id: int, workflows: dict):

    db = SessionLocal()

    project = db.get(Project, project_id)

    project.workflows = str(workflows)

    db.commit()

    return {"msg": "saved"}


# ✅ DEPLOY
@app.post("/deploy")
def deploy(data: dict):

    db = SessionLocal()

    project = db.query(Project).get(data["project_id"])

    
    workflows = json.loads(project.workflows)


    record = Deployment(
        project_id=project.id,
        component=data["form_data"]["component"],
        action=data["form_data"]["action"],
        status="running"
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    trigger_deployment.delay(
        data["form_data"],
        record.id,
        project.repo,
        workflows,
        project.type   # ✅ IMPORTANT
    )

    return {"msg": "triggered"}


@app.get("/deployments")
def get_deployments():
    db = SessionLocal()
    return db.query(Deployment).all()