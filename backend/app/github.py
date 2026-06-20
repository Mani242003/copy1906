import requests
import os
import time

# ✅ ----------- PAYLOAD FUNCTIONS -----------

def frontend_build_payload(release):
    return {
        "relordev": "Development",
        "relno": release,
        "branchName": "develop",
        "buildimage": "Y",
        "uploadimage": "Y",
        "environment": "sit1"
    }


def backend_build_payload(release):
    return {
        "relordev": "Development",
        "relno": release,
        "branchName": "develop",
        "buildimage": "Y",
        "uploadimage": "Y",
        "environment": "sit1",
        "runner": "ubuntu-latest"
    }


def frontend_deploy_payload():
    return {
        "ocptoken": "dummy_token",
        "environment": "sit1",
        "projectName": "cmomobile-sit01",
        "selectpackage": "ALL",
        "selectall": "ALL"
    }


def backend_deploy_payload():
    return {
        "ocptoken": "dummy_token",
        "environment": "sit1",
        "projectName": "cmomobile-sit01",
        "prodFlag": "",
        "selectpackage": "ALL",
        "selectall": "ALL",
        "branchName": "",
        "backupFlag": "N",
        "runner": "ubuntu-latest"
    }


# ✅ ----------- CORE GITHUB API CALL -----------

def call_github(repo, workflow_file, payload):

    workflow_file = workflow_file.strip()

    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/dispatches"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
        "Accept": "application/vnd.github+json"
    }

    data = {
        "ref": "main",
        "inputs": payload
    }

    res = requests.post(url, json=data, headers=headers)

    print("🚀 Triggered:", workflow_file)
    print("STATUS:", res.status_code)
    print("URL:", url)
    print("PAYLOAD:", payload)

    if res.status_code != 204:
        print("❌ ERROR:", res.text)


# ✅ ----------- BUILD / DEPLOY DECIDER (TYPE‑1 ONLY) -----------

def trigger_workflow(action, component, release, repo, workflows):

    print(f"🔥 ACTION: {action} | COMPONENT: {component}")

    # ✅ FRONTEND
    if component == "frontend":

        if action == "build":
            call_github(
                repo,
                workflows["frontend_build"],
                frontend_build_payload(release)
            )

        elif action == "deploy":
            call_github(
                repo,
                workflows["frontend_deploy"],
                frontend_deploy_payload()
            )

    # ✅ BACKEND
    elif component == "backend":

        if action == "build":
            call_github(
                repo,
                workflows["backend_build"],
                backend_build_payload(release)
            )

        elif action == "deploy":
            call_github(
                repo,
                workflows["backend_deploy"],
                backend_deploy_payload()
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