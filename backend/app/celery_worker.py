from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery.task(name="trigger_deployment")
def trigger_deployment(form_data, workflow_file, repo):

    print("🚀 Triggering file:", workflow_file)

    from app.github import call_github

    # ✅ DO NOT MODIFY KEYS
    payload = {
        "ref": "main",
        "inputs": form_data
    }

    call_github(repo, workflow_file, payload)