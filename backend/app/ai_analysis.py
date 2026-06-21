from dotenv import load_dotenv
import os
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def analyze_logs(logs):

    try:
        prompt = f"""
        You are a senior DevOps engineer.

        Analyze this GitHub Actions log:

        {logs}

        Give:
        ROOT CAUSE:
        FIX:
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