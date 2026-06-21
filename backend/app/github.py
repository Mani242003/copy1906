import requests
import os
import time

# ✅ ----------- PAYLOAD FUNCTIONS -----------

# def frontend_build_payload(release):
#     return {
#         "relordev": "Development",
#         "relno": release,
#         "branchName": "develop",
#         "buildimage": "Y",
#         "uploadimage": "Y",
#         "environment": "sit1"
#     }


# def backend_build_payload(release):
#     return {
#         "relordev": "Development",
#         "relno": release,
#         "branchName": "develop",
#         "buildimage": "Y",
#         "uploadimage": "Y",
#         "environment": "sit1",
#         "runner": "ubuntu-latest"
#     }


# def frontend_deploy_payload():
#     return {
#         "ocptoken": "dummy_token",
#         "environment": "sit1",
#         "projectName": "cmomobile-sit01",
#         "selectpackage": "ALL",
#         "selectall": "ALL"
#     }


# def backend_deploy_payload():
#     return {
#         "ocptoken": "dummy_token",
#         "environment": "sit1",
#         "projectName": "cmomobile-sit01",
#         "prodFlag": "",
#         "selectpackage": "ALL",
#         "selectall": "ALL",
#         "branchName": "",
#         "backupFlag": "N",
#         "runner": "ubuntu-latest"
#     }

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# ✅ ----------- CORE GITHUB API CALL -----------

def call_github(repo, workflow_id, payload):

    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_id}/dispatches"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}"
    }

    res = requests.post(url, json=payload, headers=headers)

    print("Workflow ID:", workflow_id)
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text)
def trigger_workflow(action, component, release, repo, workflows, form_data):

    print(f"🔥 ACTION: {action} | COMPONENT: {component}")

    if component == "frontend":

        if action == "build":
            call_github(
                repo,
                workflows["frontend_build"]["file"],   # ✅ FIXED
                {},
                form_data
            )

        elif action == "deploy":
            call_github(
                repo,
                workflows["frontend_deploy"]["file"],   # ✅ FIXED
                {},
                form_data
            )

    elif component == "backend":

        if action == "build":
            call_github(
                repo,
                workflows["backend_build"]["file"],   # ✅ FIXED
                {},
                form_data
            )

        elif action == "deploy":
            call_github(
                repo,
                workflows["backend_deploy"]["file"],  # ✅ FIXED
                {},
                form_data
            )
# ✅ ----------- GET OLD RUN IDS -----------

def get_old_run_ids(repo, workflow_file):

    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/runs"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}"
    }

    res = requests.get(url, headers=headers).json()

    return [run["id"] for run in res.get("workflow_runs", [])]


# ✅ ----------- WAIT FOR BUILD COMPLETION -----------

def wait_for_build_completion(repo, workflow_file, old_ids):

    print(f"⏳ Waiting for {workflow_file} completion...")

    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/runs"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}"
    }

    new_run_id = None

    # ✅ STEP 1 → Detect new run
    while not new_run_id:

        res = requests.get(url, headers=headers).json()

        for run in res.get("workflow_runs", []):
            if run["id"] not in old_ids:
                new_run_id = run["id"]
                print("✅ New run detected:", new_run_id)
                break

        time.sleep(3)

    # ✅ STEP 2 → Track status
    while True:

        res = requests.get(url, headers=headers).json()

        for run in res.get("workflow_runs", []):
            if run["id"] == new_run_id:

                status = run["status"]
                conclusion = run["conclusion"]

                print(f"STATUS: {status} | RESULT: {conclusion}")

                if status == "completed":
                    return conclusion == "success"

        time.sleep(5)
        



def get_workflows(repo):
    url = f"https://api.github.com/repos/{repo}/contents/.github/workflows"

    headers = {
        "Authorization": f"token {GITHUB_TOKEN}"
    }

    res = requests.get(url, headers=headers)

    if res.status_code != 200:
        return []

    files = res.json()

    workflows = []

    for f in files:
        if f["name"].endswith(".yml") or f["name"].endswith(".yaml"):
            workflows.append({
                "name": f["name"],
                "file": f["name"],
                "url": f["download_url"]   # ✅ REQUIRED
            })

    return workflows