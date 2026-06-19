import google.generativeai as genai
import os
import json
import re

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY"),
    transport="rest"
)

model = genai.GenerativeModel("gemini-2.5-flash")


# def parse_command(cmd):
#     prompt = f"""
#     Convert into JSON:
#     command: {cmd}

#     format:
#     action: (build / deploy / build_deploy)
#     component: (frontend / backend)
#     release: version
#     environment: dev/prod (if mentioned)
#     """

#     res = model.generate_content(prompt)
#     text = res.text

#     cleaned = re.sub(r"```json|```", "", text).strip()

#     return json.loads(cleaned)



def parse_command(cmd):

    cmd = cmd.lower().strip()

    # ✅ COMPONENT DETECTION
    if "frontend" in cmd:
        component = "frontend"
    elif "backend" in cmd:
        component = "backend"
    else:
        component = "frontend"   # default fallback

    # ✅ ACTION DETECTION (IMPORTANT ORDER)
    if (
        "build and deploy" in cmd or
        "build_deploy" in cmd or
        ("build" in cmd and "deploy" in cmd)
    ):
        action = "build_deploy"

    elif "deploy" in cmd:
        action = "deploy"

    elif "build" in cmd:
        action = "build"

    else:
        action = "build"   # safe fallback

    return {
        "action": action,
        "component": component,
        "release": "26.43"
    }