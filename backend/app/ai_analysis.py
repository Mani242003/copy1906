from dotenv import load_dotenv
import os
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_logs(logs):

    try:
        prompt = f"""
        You are a DevOps assistant.

        Analyze the following CI/CD logs and respond ONLY in this format:

        ROOT CAUSE 1:
        <short reason>

        SOLUTION:
        <short fix>

        ---

        ROOT CAUSE 2:
        <short reason>

        SOLUTION:
        <short fix>

        ---

        IMPORTANT RULES:
        - Keep each root cause SHORT (1–2 lines)
        - Do NOT explain too much
        - Do NOT write long paragraphs
        - If no clear issue found → say "No critical issue found"

        Logs:
        {logs}
        """

        res = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return {
            "success": True,
            "output": res.text
        }

    except Exception as e:

        print("❌ Gemini failed:", e)

        return {
            "success": False,
            "output": "⚠️ Sorry, AI limit reached. Please try again later."
        }