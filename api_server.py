import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# IMPORTANT: No heavy imports at module level!
# text_extraction, nutrition_info, llm_model, diet_analyzer are loaded lazily
# inside the /analyze endpoint. This ensures Flask can bind to a port immediately
# on Render without waiting for PyTorch/SentenceTransformers/ChromaDB to load.
#
# recipe_query.search_recipe()'s embedding model is loaded lazily too, on
# whichever request first needs it (~30-100s cold) rather than eagerly at
# boot — deliberately kept this way on a 512MB Render free-tier instance,
# where eagerly loading ~400MB+ of torch/sentence-transformers on every boot
# risks OOM/502s regardless of whether any request ever needs recipe search.

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


class StreamlitUploadedFileWrapper:
    """Wraps Flask file upload object to support Streamlit file interface (.getvalue())"""
    def __init__(self, file_storage):
        self.data = file_storage.read()
    def getvalue(self):
        return self.data

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "ai-nutritionist-python"}), 200


@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Lazy import heavy modules only when endpoint is called
        from text_extraction import process_input
        from nutrition_info import analyze_meal, get_meal_nutrient_totals, prefetch_foods_data
        from llm_model import ai_nutritionist
        from diet_analyzer import analyze_diet_progress

        # 1. Extract inputs
        text = request.form.get('text')
        photo_file = request.files.get('photo')
        
        goal = request.form.get('goal', 'lose')
        diet_type = request.form.get('dietType', 'non-veg')
        
        # Parse arrays if sent as JSON strings
        allergies_raw = request.form.get('allergies', '[]')
        restrictions_raw = request.form.get('restrictions', '[]')
        try:
            allergies = json.loads(allergies_raw)
        except:
            allergies = []
        try:
            restrictions = json.loads(restrictions_raw)
        except:
            restrictions = []
            
        cuisine_preference = request.form.get('cuisinePreference', 'Any')
        meal_type = request.form.get('mealType', 'Lunch')

        # 2. Extract food list using vision or text
        wrapped_file = StreamlitUploadedFileWrapper(photo_file) if photo_file else None
        extracted_text = process_input(input_data=text, uploaded_file=wrapped_file)

        if not extracted_text or extracted_text.startswith("❌"):
            return jsonify({"message": f"Extraction failed: {extracted_text}"}), 400

        # Convert to ingredients list
        detected_foods = [food.strip() for food in extracted_text.split(",") if food.strip()]

        # 3. Fetch USDA data for each detected food exactly once, shared between
        # the legacy text summary and the structured totals below (previously
        # each fetched the same foods independently, ~doubling USDA latency).
        foods_data = prefetch_foods_data(extracted_text)
        nutrition_summary = analyze_meal(extracted_text, foods_data=foods_data)

        # 3b. Structured macro + micronutrient totals for the Nutrient Gap Tracker
        try:
            nutrient_totals = get_meal_nutrient_totals(extracted_text, foods_data=foods_data)
        except Exception as e:
            print(f"Error computing structured nutrient totals: {e}")
            nutrient_totals = {}

        # 4. Macro totals — sourced from the real USDA-backed structured totals
        # (nutrient_totals, computed above), not from parsing analyze_meal()'s text.
        # analyze_meal() always returns "Could not add to database" for every food
        # because ChromaDB is unconditionally bypassed (see nutrition_info.py
        # _get_collection()), so regex-parsing it for macros always found nothing
        # and silently fell back to fixed placeholder numbers for every meal.
        total_calories = round(nutrient_totals.get("calories", 0))
        total_protein = round(nutrient_totals.get("protein", 0), 1)
        total_carbs = round(nutrient_totals.get("carbs", 0), 1)
        total_fats = round(nutrient_totals.get("fat", 0), 1)

        # 5. Get diet progress analysis (now a compact structured dict — see
        # diet_analyzer.py — no more free-text prose to parse) & recommendations
        diet_analysis = analyze_diet_progress(
            nutrition_summary=nutrition_summary,
            user_goal=goal,
            current_diet=diet_type
        )

        ai_consultation = ai_nutritionist(
            user_input=extracted_text,
            goal=goal,
            food_type=diet_type,
            dietary_restrictions=[r.lower() for r in restrictions],
            allergies=[a.lower() for a in allergies],
            cuisine_preference=cuisine_preference.lower() if cuisine_preference != "Any" else None
        )

        # 6. Build response — structured, not prose. `nutrients` holds every
        # macro/micronutrient in one place; `goalAlignment` + `suggestion` are
        # the compact goal-fit assessment. `aiConsultation` (the separate,
        # deliberately detailed recipe-recommendation feature) is unchanged.
        payload = {
            "mealType": meal_type,
            "foodItems": detected_foods,
            "nutrients": {
                "calories": total_calories,
                "protein": total_protein,
                "carbs": total_carbs,
                "fats": total_fats,
                "fiber": nutrient_totals.get("fiber", 0),
                "iron": nutrient_totals.get("iron", 0),
                "calcium": nutrient_totals.get("calcium", 0),
                "vitaminD": nutrient_totals.get("vitaminD", 0),
                "vitaminC": nutrient_totals.get("vitaminC", 0),
                "potassium": nutrient_totals.get("potassium", 0),
            },
            "goalAlignment": {
                "score": diet_analysis["score"],
                "verdict": diet_analysis["verdict"],
                "summary": diet_analysis["summary"],
            },
            "suggestion": diet_analysis["suggestion"],
            "aiConsultation": ai_consultation,
        }

        return jsonify(payload)

    except Exception as e:
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Python AI Nutritionist API server on port {port}...")
    app.run(host='0.0.0.0', port=port)
