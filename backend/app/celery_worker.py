from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery.task(name="trigger_deployment")
def trigger_deployment(form_data, workflow_file, repo, dep_id):

    from app.github import call_github, get_old_run_ids, wait_for_build_completion, get_workflow_logs
    from app.database import SessionLocal
    from app.models import Deployment
    from app.ai_analysis import analyze_logs

    import json

    db = SessionLocal()
    logs = ""

    try:
        print("🚀 Triggering file:", workflow_file)

        # ✅ STEP 1: trigger workflow
        old_ids = get_old_run_ids(repo, workflow_file)

        payload = {
            "ref": "main",
            "inputs": form_data
        }

        call_github(repo, workflow_file, payload)

        # ✅ STEP 2: wait for completion
        result = wait_for_build_completion(repo, workflow_file, old_ids)

        success = result["success"]
        run_id = result["run_id"]

        # ✅ STEP 3: fetch logs
        logs = get_workflow_logs(repo, run_id)

        print("✅ LOGS:", logs[:400])

        # ✅ STEP 4: AI
        ai_data = analyze_logs(logs)
        if not ai_result or len(ai_result) > 1500:
            ai_result = "⚠️ AI response unavailable (limit reached or invalid response)"

        if not ai_result:
            ai_result = "⚠️ Sorry, AI limit reached. Please try again later."

        # ✅ STEP 5: LOAD DEPLOYMENT
        dep = db.query(Deployment).get(dep_id)
        print("✅ BEFORE CHAT:", dep.chat_history)
        print("✅ OLD CHAT:", dep.chat_history)

        # ✅ STEP 6: LOAD OLD CHAT
        if dep.chat_history:
            chat = json.loads(dep.chat_history)

            retry_count = sum(
                1 for msg in chat if "RETRY" in msg.get("message", "")
            ) + 1

            chat.append({
                "role": "system",
                "message": f"🔁 RETRY #{retry_count}"
            })

        else:
            chat = [
                {"role": "system", "message": "🚀 Deployment triggered"}
            ]

        # ✅ STEP 7: ADD NEW INFO
        chat.append({
            "role": "system",
            "message": f"Status: {'success' if success else 'failed'}"
        })

        chat.append({
            "role": "system",
            "message": f"Logs:\n{logs}"
        })

        chat.append({
            "role": "ai",
            "message": str(ai_result)
        })

        # ✅ STEP 8: SAVE
        dep.status = "success" if success else "failed"
        dep.logs = logs
        dep.chat_history = json.dumps(chat)

        db.commit()
        

    except Exception as e:
        print("❌ ERROR:", e)

        dep = db.query(Deployment).get(dep_id)
        dep.status = "failed"
        db.commit()

    finally:
        db.close()