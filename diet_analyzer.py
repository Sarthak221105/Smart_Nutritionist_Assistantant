import os
import re
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


def analyze_diet_progress(nutrition_summary, user_goal, current_diet):
    """
    Returns a compact, structured assessment of how a meal aligns with the
    user's goal — a dict with verdict/score/summary/suggestion — instead of a
    long narrative. Callers no longer need to parse anything out of prose.
    """
    fallback = {
        "verdict": "neutral",
        "score": 5,
        "summary": "Could not analyze this meal right now.",
        "suggestion": "Please try again in a moment.",
    }

    try:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return {**fallback, "summary": "API key not found. Please check your environment variables."}

        genai.configure(api_key=api_key)

        goal_map = {
            'lose': 'weight loss',
            'maintain': 'weight maintenance',
            'gain': 'weight gain'
        }
        diet_map = {
            'vegetarian': 'vegetarian',
            'vegan': 'vegan',
            'non-veg': 'non-vegetarian'
        }

        prompt = f"""
Analyze this meal for a user with the following context:
- Goal: {goal_map.get(user_goal, user_goal)}
- Current diet: {diet_map.get(current_diet, current_diet)}

Nutrition information:
{nutrition_summary}

Respond with ONLY a single JSON object — no markdown fences, no commentary
before or after it — with exactly these keys:
{{
  "verdict": one of "helping", "hindering", or "neutral" — whether this meal supports the user's goal,
  "score": integer 1-10 alignment score,
  "summary": one or two concise sentences explaining the assessment (plain language, no jargon),
  "suggestion": one short, concrete, actionable suggestion for their next meal
}}
"""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip a markdown fence if the model added one despite instructions
        text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text).strip()

        parsed = json.loads(text)
        verdict = parsed.get("verdict", "neutral")
        if verdict not in ("helping", "hindering", "neutral"):
            verdict = "neutral"

        return {
            "verdict": verdict,
            "score": max(1, min(10, int(parsed.get("score", 5)))),
            "summary": parsed.get("summary", fallback["summary"]),
            "suggestion": parsed.get("suggestion", fallback["suggestion"]),
        }

    except Exception as e:
        return {**fallback, "summary": f"Could not analyze this meal: {e}"}
