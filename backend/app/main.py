from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.models import Project, Deployment
from app.celery_worker import trigger_deployment
from app.ai_agent import parse_command
import json

from app.parser import parse_workflow_inputs
from app.github import get_workflows

from app.database import engine
from app.models import Base


app = FastAPI()


@app.on_event("startup")
def startup():
    print("🔥 Creating tables now...")
    Base.metadata.create_all(bind=engine)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ✅ TEMP FIX (or keep localhost later)
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


# ✅ CREATE PROJECT (FIXED)
@app.post("/create_project")
def create_project(data: dict):
    db = SessionLocal()
    try:
        project = Project(
            name=data["name"],
            repo=data["repo"],
            workflows=json.dumps(data.get("workflows", {})),
            saved_values=json.dumps({})
        )

        db.add(project)
        db.commit()
        return {"msg": "created"}
    finally:
        db.close()


@app.get("/projects")
def get_projects():
    db = SessionLocal()
    try:
        projects = db.query(Project).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "repo": p.repo,

                "workflows": p.workflows,           # ✅ ADD
                "saved_values": p.saved_values

            }
            for p in projects
        ]
    finally:
        db.close()


@app.post("/save_workflow")
def save_workflow(project_id: int, workflows: dict):

    db = SessionLocal()

    project = db.get(Project, project_id)

    project.workflows = json.dumps(workflows)

    db.commit()

    return {"msg": "saved"}


# ✅ DEPLOY (FIXED)

@app.post("/deploy")
def deploy(data: dict):

    selected_key = data.get("workflow_key")

    db = SessionLocal()

    project = db.query(Project).get(data["project_id"])
    workflows = json.loads(project.workflows)
    saved_values = json.loads(project.saved_values or "{}")

    workflow = workflows[selected_key]

    # ✅ VALID WORKFLOW CHECK
    if not workflow.get("fields"):
        return {"msg": "This workflow cannot be triggered ❌"}

    # ✅ GET SAVED VALUES (DO NOT CHANGE)
    workflow_values = saved_values.get(selected_key, {})

    # ✅ ✅ ✅ VALIDATION (THIS IS THE ONLY NEW PART)
    missing = []

    for field in workflow.get("fields", []):
        if not workflow_values.get(field["key"]):
            missing.append(field["key"])

    if missing:
        # ✅ STOP BEFORE CELERY
        return {"msg": f"Missing required inputs: {', '.join(missing)} ❌"}

    # ✅ SAFE TO TRIGGER
    trigger_deployment.delay(
        workflow_values,
        workflow["file"],
        project.repo
    )

    return {"msg": "triggered"}

@app.get("/deployments")
def get_deployments():
    db = SessionLocal()
    return db.query(Deployment).all()


@app.delete("/project/{id}")
def delete_project(id: int):

    db = SessionLocal()

    project = db.get(Project, id)

    if not project:
        return {"msg": "Not found"}

    db.delete(project)
    db.commit()

    return {"msg": "deleted"}


@app.put("/project/{id}")
def update_project(id: int, data: dict):

    db = SessionLocal()

    project = db.query(Project).get(id)

    if not project:
        return {"msg": "Not found"}

    project.name = data["name"]
    project.repo = data["repo"]
    project.workflows = json.dumps(data["workflows"])
    project.saved_values = json.dumps(data.get("saved_values", {}))

    db.commit()

    return {"msg": "updated"}


@app.get("/workflows")
def workflows(repo: str):

    files = get_workflows(repo)

    result = {}

    for f in files:
        fields = parse_workflow_inputs(f["url"])

        result[f["name"]] = {
            "file": f["file"],
            
            "fields": fields
        }

    return result

