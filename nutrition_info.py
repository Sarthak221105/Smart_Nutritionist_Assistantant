import os
import re
import requests
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings

# ----------------------------------------------------
# 🔧 Setup
# ----------------------------------------------------
load_dotenv()

USDA_API_KEY = os.getenv("USDA_API_KEY")


client = chromadb.PersistentClient(path="./chroma_nutrition")
collection = client.get_or_create_collection("nutrition_usda")

BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"


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
        response = requests.get(BASE_URL, params=params, timeout=10)

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
            "metadata": {
                "source": "USDA",
                "name": food_name.lower(),
                "energy": energy,
                "protein": protein,
                "fat": fat,
                "carbs": carbs
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


# Analyze a meal - improved version
def analyze_meal(meal_text):
    if not meal_text or not isinstance(meal_text, str):
        return "Please provide a valid meal description."

    foods = extract_foods_from_text(meal_text)
    print(f"\n🍽️ Foods detected: {foods}\n")

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
            item = fetch_food_data(food)
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

