import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


def analyze_diet_progress(nutrition_summary, user_goal, current_diet):
    try:
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return "❌ API key not found. Please check your environment variables."

        genai.configure(api_key=api_key)

        # Map goals to readable format
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
# DIET PROGRESS ANALYSIS

## USER CONTEXT
- **Goal**: {goal_map.get(user_goal, user_goal)}
- **Current Diet**: {diet_map.get(current_diet, current_diet)}

## NUTRITION INFORMATION
{nutrition_summary}

## YOUR TASK:
Analyze this meal/diet and determine if it aligns with the user's goals. Provide:

### 🎯 PROGRESS ASSESSMENT
- Is this meal helping or hindering their goal?
- Rate the alignment on a scale of 1-10
- Key strengths and weaknesses

### 📊 NUTRITIONAL ANALYSIS
- Macronutrient balance assessment
- Calorie appropriateness for the goal
- Missing or excessive nutrients

### 💡 ACTIONABLE RECOMMENDATIONS
- Specific changes needed (if any)
- What to continue doing
- What to adjust

### 🚨 RED FLAGS (if any)
- Any concerning nutritional patterns
- Potential health implications

### 📈 NEXT STEPS
- Immediate adjustments
- Long-term strategy

## OUTPUT FORMAT:
Keep it structured but conversational. Be encouraging but honest.
Use emojis to make it engaging.

Focus on evidence-based nutrition science and practical advice.
"""

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        return f"❌ Error analyzing diet progress: {str(e)}"

