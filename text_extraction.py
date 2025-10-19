import os
import re
import tempfile
from dotenv import load_dotenv

load_dotenv()


def extract_foods_with_gemini(image_path):
    """Extract food items from image using Gemini"""
    try:
        import google.generativeai as genai
        from PIL import Image

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Google API key not found in environment variables")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        image = Image.open(image_path)
        prompt = (
            "Extract all visible food items from this image. "
            "Return only a simple comma-separated list of food names. "
            "Example: 'banana, apple, bread, chicken' "
            "Do not include quantities, descriptions, or other text."
        )

        response = model.generate_content([prompt, image])

        # Clean and parse the response
        food_text = response.text.strip()
        # Remove any markdown formatting or extra text
        food_text = re.sub(r'[*`]', '', food_text)

        return food_text

    except ImportError:
        return "❌ Required packages not installed: pip install google-generativeai pillow"
    except Exception as e:
        return f"❌ Error extracting foods from image: {e}"


def extract_foods_from_text(text):
    """Extract and clean food items from text input"""
    if not text or not isinstance(text, str):
        return ""

    text = text.lower()

    # Remove common measurement words and quantities
    text = re.sub(r'\b\d+\s*\w*\b', '', text)  # remove numbers and units
    text = re.sub(r'\b(cup|tbsp|tsp|oz|gram|kg|lb|slice|piece|clove|ml)\w*\b', '', text)

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

    # Return as comma-separated string
    return ", ".join(cleaned_foods)


def process_input(input_data=None, uploaded_file=None):
    """
    Main function to process input and return extracted food text
    Args:
        input_data: text input
        uploaded_file: streamlit uploaded file object
    Returns:
        str: extracted food text or error message
    """
    try:
        if uploaded_file is not None:
            print("🖼️ Extracting food items from uploaded image...")
            # Use tempfile for safe temporary file handling
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(uploaded_file.getvalue())
                temp_path = temp_file.name

            try:
                extracted_text = extract_foods_with_gemini(temp_path)
                return extracted_text
            finally:
                # Ensure temp file is deleted even if extraction fails
                try:
                    os.unlink(temp_path)
                except:
                    pass  # Ignore deletion errors

        elif input_data and isinstance(input_data, str):
            print("📝 Extracting food items from text...")
            extracted_text = extract_foods_from_text(input_data)
            return extracted_text
        else:
            return "❌ No valid input provided"

    except Exception as e:
        return f"❌ Error in process_input: {e}"


