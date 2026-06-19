from celery_worker import celery
from app.github import get_runs, get_logs
from app.database import save_record
from app.notification import notify
from app.rag import store_logs, query_logs
from app.ai_agent import analyze_failure

@celery.task(bind=True, max_retries=10)
def monitor_pipeline(self, parsed):
    runs = get_runs()
    run = runs['workflow_runs'][0]

    if run['status'] != "completed":
        raise self.retry(countdown=30)

    if run['conclusion'] == "success":
        save_record(parsed, run['id'], "SUCCESS")
        notify("SUCCESS", parsed)
    else:
        logs = get_logs(run['id'])
        store_logs(logs)
        context = query_logs("error")
        rca = analyze_failure(context)

        save_record(parsed, run['id'], "FAILED")
        notify("FAILED", parsed, rca)