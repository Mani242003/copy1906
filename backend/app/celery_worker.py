from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",   # ✅ FIX
    backend="redis://localhost:6379/0"   # ✅ FIX
)

@celery.task
def trigger_deployment(form_data, record_id, repo, workflows, type):

    from app.database import SessionLocal
    from app.models import Deployment

    from app.github import (
        trigger_workflow,
        get_old_run_ids,
        wait_for_build_completion,
        call_github
    )

    db = SessionLocal()
    record = db.query(Deployment).filter(Deployment.id == record_id).first()

    try:
        component = form_data["component"]
        action = form_data["action"]
        release = form_data.get("relno", "1.0")

        print("✅ TYPE:", type)
        print("✅ ACTION:", action)

        # ============================
        # ✅ TYPE‑1 (USE BACKEND CONTROL)
        # ============================
        if type == "type1":

            action = action.strip()   # ✅ FIX

            if action == "build":
                trigger_workflow("build", component, release, repo, workflows)

            elif action == "deploy":
                trigger_workflow("deploy", component, release, repo, workflows)

            elif action == "build_deploy":

                print("✅ STEP 1: BUILD")

                # ✅ identify correct workflow
                if component == "frontend":
                    build_wf = workflows["frontend_build"]
                else:
                    build_wf = workflows["backend_build"]

                old_ids = get_old_run_ids(repo, build_wf)

                trigger_workflow("build", component, release, repo, workflows)

                print("⏳ Waiting for build completion...")

                success = wait_for_build_completion(repo, build_wf, old_ids)

                if success:
                    print("✅ BUILD SUCCESS → DEPLOY")
                    trigger_workflow("deploy", component, release, repo, workflows)
                else:
                    print("❌ BUILD FAILED → STOP DEPLOY")

        # ============================
        # ✅ TYPE‑2 (USE GITHUB CONTROL)
        # ============================
        elif type == "type2":

            print("✅ TYPE2 → GITHUB PIPELINE")

            # ✅ ONLY COMBINED WORKFLOW
            if component == "frontend":
                wf = workflows["frontend_build_deploy"]
            else:
                wf = workflows["backend_build_deploy"]

            payload = {
                "version": release,
                "ocptoken": "dummy_token"
            }

            call_github(repo, wf, payload)

        record.status = "completed"

    except Exception as e:
        print("❌ ERROR:", e)
        record.status = "failed"

    db.commit()