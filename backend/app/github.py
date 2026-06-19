import requests
import os
import time

REPO = "Mani242003/Dummy_repo"

WORKFLOWS = {
    "frontend_build": "frontend-build-dispatch.yml",
    "frontend_deploy": "frontend-deploy-dispatch.yml",
    "backend_build": "backend-build-dispatch.yml",
    "backend_deploy": "backend-deploy-dispatch.yml"
}

# ---------------- PAYLOADS ----------------

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

# ---------------- API CALL ----------------

def trigger_github_call(workflow_file, payload):
    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{workflow_file}/dispatches"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
        "Accept": "application/vnd.github+json"
    }

    data = {
        "ref": "main",
        "inputs": payload
    }

    res = requests.post(url, json=data, headers=headers)

    print(f"🚀 Triggered: {workflow_file} | Status: {res.status_code}")
    print("📦 PAYLOAD:", payload)

    if res.status_code != 204:
        print("❌ ERROR:", res.text)

    return res.status_code


def get_old_run_ids(workflow_file):
    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{workflow_file}/runs"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}"
    }

    res = requests.get(url, headers=headers).json()
    runs = res.get("workflow_runs", [])

    return [run["id"] for run in runs]


def wait_for_build_completion(workflow_file, old_ids):
    print(f"⏳ Waiting for new run of {workflow_file}...")

    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{workflow_file}/runs"

    headers = {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}"
    }

    new_run_id = None

    while True:
        res = requests.get(url, headers=headers).json()
        runs = res.get("workflow_runs", [])

        for run in runs:
            if run["id"] not in old_ids:
                new_run_id = run["id"]
                print("✅ New run detected:", new_run_id)
                break

        if new_run_id:
            break

        time.sleep(3)

    while True:
        res = requests.get(url, headers=headers).json()
        runs = res.get("workflow_runs", [])

        for run in runs:
            if run["id"] == new_run_id:
                status = run["status"]
                conclusion = run["conclusion"]

                print(f"STATUS: {status} | RESULT: {conclusion}")

                if status == "completed":
                    return conclusion == "success"

        time.sleep(5)


# ---------------- MAIN FUNCTION ----------------

def trigger_workflow(action, component, release):

    print("\n==== MAIN FLOW ====")
    print("Component:", component)
    print("Action:", action)

    # ---------------- FRONTEND ----------------
    if component == "frontend":

        if action == "build":
            trigger_github_call(WORKFLOWS["frontend_build"], frontend_build_payload(release))

        elif action == "deploy":
            trigger_github_call(WORKFLOWS["frontend_deploy"], frontend_deploy_payload())

        elif action == "build_deploy":

            print("✅ FRONTEND BUILD → WAIT → DEPLOY")

            old_ids = get_old_run_ids(WORKFLOWS["frontend_build"])

            status = trigger_github_call(
                WORKFLOWS["frontend_build"],
                frontend_build_payload(release)
            )

            if status == 204:
                success = wait_for_build_completion(
                    WORKFLOWS["frontend_build"],
                    old_ids
                )

                if success:
                    print("✅ Build success → Deploying now")

                    # ✅ FIXED HERE
                    trigger_github_call(
                        WORKFLOWS["frontend_deploy"],
                        frontend_deploy_payload()
                    )
                else:
                    print("❌ Build failed → Deploy skipped")

    # ---------------- BACKEND ----------------
    elif component == "backend":

        if action == "build":
            trigger_github_call(WORKFLOWS["backend_build"], backend_build_payload(release))

        elif action == "deploy":
            trigger_github_call(WORKFLOWS["backend_deploy"], backend_deploy_payload())

        elif action == "build_deploy":

            print("✅ BACKEND BUILD → WAIT → DEPLOY")

            old_ids = get_old_run_ids(WORKFLOWS["backend_build"])

            status = trigger_github_call(
                WORKFLOWS["backend_build"],
                backend_build_payload(release)
            )

            if status == 204:
                success = wait_for_build_completion(
                    WORKFLOWS["backend_build"],
                    old_ids
                )

                if success:
                    print("✅ Build success → Deploying now")
                    trigger_github_call(
                        WORKFLOWS["backend_deploy"],
                        backend_deploy_payload()
                    )
                else:
                    print("❌ Build failed → Deploy skipped")