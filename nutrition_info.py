import os
import re
import requests
from dotenv import load_dotenv

# ----------------------------------------------------
# 🔧 Setup
# ----------------------------------------------------
load_dotenv()

USDA_API_KEY = os.getenv("USDA_API_KEY")
BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# Maps our tracked micronutrient keys to the USDA FoodData Central nutrient name
# and the unit we report it in. Extend this to track more nutrients over time.
TRACKED_NUTRIENTS = {
    "fiber": {"usda_name": "Fiber, total dietary", "unit": "g"},
    "iron": {"usda_name": "Iron, Fe", "unit": "mg"},
    "calcium": {"usda_name": "Calcium, Ca", "unit": "mg"},
    "vitaminD": {"usda_name": "Vitamin D (D2 + D3)", "unit": "mcg"},
    "vitaminC": {"usda_name": "Vitamin C, total ascorbic acid", "unit": "mg"},
    "potassium": {"usda_name": "Potassium, K", "unit": "mg"},
}

# Lazy ChromaDB initialization — don't load at import time
_client = None
_collection = None


def _get_collection():
    """Bypassed for Render deployment compatibility to avoid heavy memory usage."""
    return None


# Shared HTTP session for USDA calls. requests.get() opens a fresh TCP+TLS
# connection every call (~0.9-1.2s handshake, confirmed by measurement); reusing
# one Session lets urllib3 keep the connection alive across calls, so only the
# first request in a process pays the handshake.
_usda_session = None


def _get_usda_session():
    global _usda_session
    if _usda_session is None:
        _usda_session = requests.Session()
    return _usda_session


# Fetch from USDA API
def fetch_food_data(food_name):
    """Fetch food data from USDA FoodData Central API."""
    params = {
        "query": food_name,
        "pageSize": 5,  # Increased to get better matches
        "api_key": USDA_API_KEY,
        "dataType": ["Foundation", "SR Legacy"]  # Filter for better quality data
    }

    try:
        session = _get_usda_session()
        response = session.get(BASE_URL, params=params, timeout=10)

        if response.status_code != 200:
            print(f"USDA API Error ({response.status_code}): {response.text}")
            return None

        data = response.json()
        if "foods" not in data or not data["foods"]:
            print(f"No food data found for '{food_name}'")
            return None

        # Get the best match (first result)
        item = data["foods"][0]

        # Extract nutrients more reliably
        nutrients = {}
        for nutrient in item.get("foodNutrients", []):
            name = nutrient.get("nutrientName")
            value = nutrient.get("value")
            if name and value is not None:
                nutrients[name] = value

        # Build document text
        energy = nutrients.get('Energy', 'N/A')
        protein = nutrients.get('Protein', 'N/A')
        fat = nutrients.get('Total lipid (fat)', 'N/A')
        carbs = nutrients.get('Carbohydrate, by difference', 'N/A')

        # Micronutrients tracked for the Nutrient Gap Tracker (may be missing per food)
        micros = {
            key: nutrients.get(spec["usda_name"], 0) or 0
            for key, spec in TRACKED_NUTRIENTS.items()
        }

        doc = (
            f"{item.get('description', 'Unknown').upper()} (FDC ID: {item.get('fdcId', 'N/A')}): "
            f"Energy: {energy} kcal, "
            f"Protein: {protein} g, "
            f"Fat: {fat} g, "
            f"Carbs: {carbs} g"
        )

        return {
            "id": str(item.get("fdcId", food_name)),
            "document": doc,
            "name": food_name.lower(),
            "nutrients": {
                "calories": energy if isinstance(energy, (int, float)) else 0,
                "protein": protein if isinstance(protein, (int, float)) else 0,
                "fat": fat if isinstance(fat, (int, float)) else 0,
                "carbs": carbs if isinstance(carbs, (int, float)) else 0,
                **micros,
            },
            "metadata": {
                "source": "USDA",
                "name": food_name.lower(),
                "energy": energy,
                "protein": protein,
                "fat": fat,
                "carbs": carbs,
                **{f"{key}_{TRACKED_NUTRIENTS[key]['unit']}": val for key, val in micros.items()}
            }
        }

    except requests.exceptions.RequestException as e:
        print(f"Network error fetching '{food_name}': {e}")
        return None
    except Exception as e:
        print(f"Error processing '{food_name}': {e}")
        return None


# Check if food exists in Chroma
def food_exists_in_chroma(food_name):
    try:
        collection = _get_collection()
        if not collection:
            return False
        results = collection.get(
            where={"name": food_name.lower()},
            limit=1
        )
        return len(results["ids"]) > 0
    except Exception as e:
        print(f"Error checking ChromaDB for '{food_name}': {e}")
        return False


# Add to Chroma if not present
def add_to_chromadb(item):
    if not item:
        return False

    try:
        collection = _get_collection()
        if not collection:
            return False
        if food_exists_in_chroma(item["name"]):
            return True

        collection.add(
            ids=[item["id"]],
            documents=[item["document"]],
            metadatas=[item["metadata"]]
        )
        return True
    except Exception as e:
        print(f"Error adding '{item['name']}' to ChromaDB: {e}")
        return False


# Extract foods from text - improved version
def extract_foods_from_text(text):
    """Split meal input into individual food items."""
    if not text or not isinstance(text, str):
        return []

    # Clean and normalize the text
    text = text.lower().strip()

    # Remove common measurement words and quantities
    text = re.sub(r'\b\d+\s*\w*\b', '', text)  # remove numbers and units
    text = re.sub(r'\b(cup|tbsp|tsp|oz|gram|kg|lb|slice|piece|clove)\w*\b', '', text)

    # Split by common separators
    foods = re.split(r',|\band\b|;|\+', text)

    # Clean each food item
    cleaned_foods = []
    for food in foods:
        food = food.strip()
        # Remove extra spaces and empty strings
        food = re.sub(r'\s+', ' ', food).strip()
        if food and len(food) > 1:  # Avoid single characters
            cleaned_foods.append(food)

    return cleaned_foods


# Query Chroma for food
def query_chroma_for_food(food_name):
    try:
        collection = _get_collection()
        results = collection.get(
            where={"name": food_name.lower()},
            limit=1
        )
        if results and results["documents"]:
            return results["documents"][0]
        return None
    except Exception as e:
        print(f"Error querying ChromaDB for '{food_name}': {e}")
        return None


# Fetches USDA data for a list of foods exactly once each, so callers that need
# both the legacy text summary (analyze_meal) and the structured totals
# (get_meal_nutrient_totals) for the same meal can share one set of network
# calls instead of each independently re-fetching every food.
def prefetch_foods_data(meal_text):
    if not meal_text or not isinstance(meal_text, str):
        return {}
    foods = extract_foods_from_text(meal_text)
    return {food: fetch_food_data(food) for food in foods}


# Analyze a meal - improved version
def analyze_meal(meal_text, foods_data=None):
    if not meal_text or not isinstance(meal_text, str):
        return "Please provide a valid meal description."

    foods = extract_foods_from_text(meal_text)
    print(f"\nFoods detected: {foods}\n")

    if not foods:
        return "No valid foods detected in the input."

    results_summary = []
    successful_fetches = 0

    for food in foods:

        # Check if food exists in ChromaDB
        if food_exists_in_chroma(food):
            print(f"Found '{food}' in ChromaDB.")
            doc = query_chroma_for_food(food)
            if doc:
                results_summary.append(doc)
                continue
        else:
            print(f"'{food}' not found in ChromaDB. Fetching from USDA API...")
            item = foods_data.get(food) if foods_data else fetch_food_data(food)
            if item:
                if add_to_chromadb(item):
                    successful_fetches += 1
                    doc = query_chroma_for_food(food)
                    if doc:
                        results_summary.append(doc)
                else:
                    results_summary.append(f"Could not add '{food}' to database.")
            else:
                results_summary.append(f"No nutrition data found for '{food}'.")

    print(f"\nSummary: Processed {len(foods)} foods, fetched {successful_fetches} new items")

    if not results_summary:
        return "No nutrition information could be retrieved for any of the provided foods."

    return "\n".join(results_summary)


# Structured macro + micronutrient totals for the Nutrient Gap Tracker.
# Fetches directly from USDA rather than routing through analyze_meal()'s
# ChromaDB-backed summary, so it works even while the vector store is bypassed.
def get_meal_nutrient_totals(meal_text, foods_data=None):
    if not meal_text or not isinstance(meal_text, str):
        return {}

    foods = extract_foods_from_text(meal_text)
    totals = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}
    totals.update({key: 0 for key in TRACKED_NUTRIENTS})

    for food in foods:
        item = foods_data.get(food) if foods_data else fetch_food_data(food)
        if not item:
            continue
        for key, value in item["nutrients"].items():
            totals[key] = round(totals.get(key, 0) + (value or 0), 2)

    return totals
