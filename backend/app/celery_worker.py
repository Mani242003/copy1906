from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",   # ✅ FIX
    backend="redis://localhost:6379/0"   # ✅ FIX
)

@celery.task
def trigger_deployment(form_data, workflow_file, repo):
    print("🚀 Triggering file:", workflow_file)

    from app.github import call_github



    clean_inputs = {}

    for k, v in form_data.items():
        clean_key = k.lower().replace(" ", "_")   # ✅ FIX
        clean_inputs[clean_key] = v

    payload = {
        "ref": "main",
        "inputs": clean_inputs
    }

    print("Triggering file:", workflow_file)

    call_github(repo, workflow_file, payload)