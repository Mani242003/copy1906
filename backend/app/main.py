from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.models import Project, Deployment
from app.celery_worker import trigger_deployment
from app.ai_agent import parse_command
import json
from app.ai_analysis import analyze_logs
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


@app.get("/deployments/{project_id}")
def get_deployments(project_id: int):

    db = SessionLocal()
    try:
        deps = db.query(Deployment)\
            .filter(Deployment.project_id == project_id)\
            .order_by(Deployment.id.desc())\
            .all()

        return [
            {
                "id": d.id,
                "workflow": d.workflow,
                "status": d.status,
                "inputs": d.inputs,
                "logs": d.logs,
                "chat_history": d.chat_history
            }
            for d in deps
        ]
    finally:
        db.close()


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

    if not workflow.get("fields"):
        return {"msg": "This workflow cannot be triggered ❌"}

    workflow_values = saved_values.get(selected_key, {})

    missing = []
    for field in workflow.get("fields", []):
        if not workflow_values.get(field["key"]):
            missing.append(field["key"])

    if missing:
        return {"msg": f"Missing required inputs: {', '.join(missing)} ❌"}

    # ✅ ✅ ✅ NEW: SAVE DEPLOYMENT (RUNNING)
    new_dep = Deployment(
        project_id=project.id,
        workflow=selected_key,
        status="running",
        inputs=json.dumps(workflow_values)
    )

    db.add(new_dep)
    db.commit()
    db.refresh(new_dep)

    # ✅ PASS dep_id to celery
    trigger_deployment.delay(
        workflow_values,
        workflow["file"],
        project.repo,
        new_dep.id   # ✅ NEW
    )

    return {"msg": "triggered"}


# @app.get("/deployments")
# def get_deployments():
#     db = SessionLocal()
#     return db.query(Deployment).all()


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


@app.post("/retry/{dep_id}")
def retry(dep_id: int):

    db = SessionLocal()

    try:
        dep = db.query(Deployment).get(dep_id)

        project = db.query(Project).get(dep.project_id)

        workflows = json.loads(project.workflows)

        workflow = workflows[dep.workflow]

        inputs = json.loads(dep.inputs or "{}")

        # ✅ UPDATE SAME RECORD
        dep.status = "running"
        dep.logs = None

        # ✅ DO NOT CLEAR CHAT
        # REMOVE THIS LINE COMPLETELY

        # dep.chat_history = None   ❌ REMOVE
        print("✅ AFTER SAVE CHAT:", dep.chat_history[:200])

        db.commit()

        # ✅ TRIGGER SAME DEPLOY ID
        trigger_deployment.delay(
            inputs,
            workflow["file"],
            project.repo,
            dep.id   # ✅ SAME ID
        )

        return {"msg": "retry started"}

    finally:
        db.close()


@app.post("/ai/analyze")
def analyze(data: dict):

    logs = data.get("logs", "")

    try:
        result = analyze_logs(logs)

        return {
            "result": result
        }

    except Exception as e:
        return {
            "result": f"AI Error: {str(e)}"
        }


@app.delete("/deployments/{dep_id}")
def delete_deployment(dep_id: int):

    db = SessionLocal()

    try:
        dep = db.query(Deployment).get(dep_id)

        if not dep:
            raise HTTPException(status_code=404, detail="Not found")

        db.delete(dep)
        db.commit()

        return {"msg": "deleted"}

    finally:
        db.close()
