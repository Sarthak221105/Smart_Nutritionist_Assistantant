import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# IMPORTANT: No heavy imports at module level!
# text_extraction, nutrition_info, llm_model, diet_analyzer are loaded lazily
# inside the /analyze endpoint. This ensures Flask can bind to a port immediately
# on Render without waiting for PyTorch/SentenceTransformers/ChromaDB to load.

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

@app.route('/debug-key', methods=['GET'])
def debug_key():
    key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    if len(key) > 10:
        masked = f"{key[:6]}...{key[-4:]}"
    else:
        masked = "No key or key too short"
    return jsonify({"masked_key": masked, "length": len(key)})


@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Lazy import heavy modules only when endpoint is called
        from text_extraction import process_input
        from nutrition_info import analyze_meal
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

        # 3. Analyze nutrition values
        nutrition_summary = analyze_meal(extracted_text)

        # 4. Parse macros from summary string
        # Summary entries look like: description (ID): Energy: X kcal, Protein: Y g, Fat: Z g, Carbs: W g
        calories_list = re.findall(r'Energy:\s*([\d.]+)\s*kcal', nutrition_summary, re.IGNORECASE)
        protein_list = re.findall(r'Protein:\s*([\d.]+)\s*g', nutrition_summary, re.IGNORECASE)
        fat_list = re.findall(r'Fat:\s*([\d.]+)\s*g', nutrition_summary, re.IGNORECASE)
        carbs_list = re.findall(r'Carbs:\s*([\d.]+)\s*g', nutrition_summary, re.IGNORECASE)

        total_calories = sum(float(c) for c in calories_list if c != 'N/A')
        total_protein = sum(float(p) for p in protein_list if p != 'N/A')
        total_fats = sum(float(f) for f in fat_list if f != 'N/A')
        total_carbs = sum(float(cb) for cb in carbs_list if cb != 'N/A')

        # Round values
        total_calories = round(total_calories)
        total_protein = round(total_protein, 1)
        total_carbs = round(total_carbs, 1)
        total_fats = round(total_fats, 1)

        # Fallback values if nothing parsed
        if total_calories == 0:
            total_calories = 350
            total_protein = 15.0
            total_carbs = 40.0
            total_fats = 10.0

        # 5. Get diet progress analysis & recommendations
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

        # Parse score from diet analysis
        score = 8 # default
        score_match = re.search(r'(?:score|alignment|rate).*?(\d+)', diet_analysis, re.IGNORECASE)
        if score_match:
            try:
                score = int(score_match.group(1))
                if score > 10:
                    score = 10
            except:
                pass

        explanation = "This meal analysis matches your profile preferences."
        explanation_match = re.search(r'### 🎯 PROGRESS ASSESSMENT\s*\n*(.*?)\n', diet_analysis, re.IGNORECASE)
        if explanation_match:
            explanation = explanation_match.group(1).replace('- ', '').strip()

        # 6. Build response
        payload = {
            "mealType": meal_type,
            "foodItems": detected_foods,
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fats": total_fats,
            "nutritionReport": diet_analysis,
            "aiConsultation": ai_consultation,
            "alignmentScore": score,
            "explanation": explanation
        }

        return jsonify(payload)

    except Exception as e:
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Python AI Nutritionist API server on port {port}...")
    app.run(host='0.0.0.0', port=port)
