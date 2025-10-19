import os
import google.generativeai as genai
from nutrition_info import analyze_meal
from recipe_query import search_recipe
from text_extraction import process_input

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


def ai_nutritionist(user_input, goal, food_type, dietary_restrictions=None, allergies=None, cuisine_preference=None):
    """
    Enhanced AI Nutritionist with Gemini
    user_input: text or food list (e.g., "banana, milk, rice, chicken")
    goal: "lose", "gain", or "maintain"
    food_type: "vegetarian", "vegan", or "non-veg"
    dietary_restrictions: list of restrictions e.g., ["low-carb", "gluten-free"]
    allergies: list of allergies e.g., ["nuts", "dairy"]
    cuisine_preference: preferred cuisine style e.g., "mediterranean", "asian"
    """
    print("Processing user input...")

    # Step 1: Extract ingredients from ORIGINAL user input
    ingredients = process_input(user_input)
    print(f"Extracted ingredients: {ingredients}")

    # Step 2: Get nutrition info
    print("Fetching nutritional info...")
    nutrition_info = analyze_meal(user_input)  # Pass original input, not processed list
    print("Nutrition info retrieved")

    # Step 3: Retrieve recipe suggestions using ORIGINAL ingredients
    recipe_query = ", ".join(ingredients)
    recipes = search_recipe(recipe_query, top_k=5)
    print("Recipes retrieved")

    # Step 4: Build enhanced LLM prompt
    prompt = f"""
# EXPERT AI NUTRITIONIST CONSULTATION

## USER PROFILE & GOALS
- **Primary Goal**: {goal.capitalize()} weight
- **Dietary Preference**: {food_type.capitalize()}
- **Dietary Restrictions**: {dietary_restrictions or "None specified"}
- **Allergies**: {allergies or "None specified"}
- **Cuisine Preference**: {cuisine_preference or "Flexible"}

## AVAILABLE INGREDIENTS
{', '.join(ingredients)}

## NUTRITIONAL ANALYSIS
{nutrition_info}

## RECIPE SUGGESTIONS (from database)
{recipes}

## YOUR TASK:
As an expert nutritionist, provide comprehensive meal recommendations that are:

### 1. GOAL-ORIENTED
- **For {goal}**: Suggest meals that align with this specific weight goal
- **Calorie-aware**: Consider appropriate portion sizes and energy density
- **Macro-balanced**: Optimal protein/carb/fat ratios for the goal

### 2. PERSONALIZED
- Respect all dietary preferences and restrictions
- Accommodate allergies: {allergies}
- Consider cuisine preferences: {cuisine_preference}

### 3. PRACTICAL & ACTIONABLE
- Use primarily available ingredients
- Suggest minimal additional ingredients if needed
- Provide clear preparation guidance

## EXPECTED OUTPUT FORMAT:

**MEAL RECOMMENDATIONS**

### Option 1: [Creative Meal Name]
**Preparation**: [Brief step-by-step instructions]
**Nutritional Benefits**: [Why this supports {goal} goal]
**Macro Breakdown**: [Approximate protein/carbs/fats]
**Additional Tips**: [Optional add-ons or substitutions]

### Option 2: [Creative Meal Name]  
**Preparation**: [Brief step-by-step instructions]
**Nutritional Benefits**: [Why this supports {goal} goal]
**Macro Breakdown**: [Approximate protein/carbs/fats]
**Additional Tips**: [Optional add-ons or substitutions]

**GOAL-SPECIFIC ADVICE**
[2-3 sentences of targeted nutrition advice for {goal}]

**SHOPPING SUGGESTIONS**
[Minimal additional ingredients to enhance meals]

Keep the tone professional yet encouraging, and ensure all recommendations are evidence-based and practical for home cooking.
"""

    # Generate response using Gemini - FIXED MODEL NAME
    try:
        print("GenAI response...")
        # Use the correct Gemini model name
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        print(" AI response generated")
        return response.text
    except Exception as e:
        return f"Error generating AI response: {str(e)}"


# Enhanced example with additional parameters
if __name__ == "__main__":
    user_input = "banana, milk, rice, chicken breast, spinach, eggs"
    goal = "lose"
    food_type = "non-veg"
    dietary_restrictions = ["low-carb", "high-protein"]
    allergies = ["nuts"]
    cuisine_preference = "mediterranean"

    print("AI NUTRITIONIST CONSULTATION")
    print("=" * 50)

    result = ai_nutritionist(
        user_input=user_input,
        goal=goal,
        food_type=food_type,
        dietary_restrictions=dietary_restrictions,
        allergies=allergies,
        cuisine_preference=cuisine_preference
    )

    print("\n" + "=" * 50)
    print("FINAL RECOMMENDATIONS:")
    print("=" * 50)
    print(result)