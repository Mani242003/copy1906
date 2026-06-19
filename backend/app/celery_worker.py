from celery import Celery

celery = Celery(
    "worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

@celery.task
def trigger_deployment(parsed, record_id):

    from app.database import SessionLocal
    from app.models import Deployment
    from app.github import trigger_workflow

    db = SessionLocal()

    record = db.query(Deployment).filter(Deployment.id == record_id).first()

    try:
        trigger_workflow(
            parsed["action"],
            parsed["component"],
            parsed["release"]
        )

        # ✅ update success
        record.status = "completed"


    except Exception as e:
        print("ERROR:", e)
        record.status = "failed"


    db.commit()
