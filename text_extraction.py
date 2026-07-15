import os
import re
import tempfile
from dotenv import load_dotenv

load_dotenv()

# Shared instruction used by every vision provider so the extraction task
# stays identical regardless of which model actually runs it.
_FOOD_PROMPT = (
    "Extract all visible food items from this image. "
    "Return only a simple comma-separated list of food names. "
    "Example: 'banana, apple, bread, chicken' "
    "Do not include quantities, descriptions, or other text."
)

NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_VISION_MODEL = "meta/llama-3.2-90b-vision-instruct"


def _downscale_image_b64(image_path, max_b64_len=170000):
    """Return base64 JPEG of the image, downscaled to fit NVIDIA's inline image
    limit (~180KB base64). Uploaded meal photos are often several MB / thousands
    of pixels, which the inline endpoint rejects, so shrink until it fits."""
    import io
    import base64
    from PIL import Image

    img = Image.open(image_path).convert("RGB")
    max_dim, quality = 1024, 85
    while True:
        resized = img.copy()
        resized.thumbnail((max_dim, max_dim))
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=quality)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        if len(b64) <= max_b64_len:
            return b64
        if quality > 55:
            quality -= 10
        else:
            max_dim = int(max_dim * 0.85)


def extract_foods_with_nvidia(image_path):
    """Extract food items from an image using NVIDIA-hosted Llama-3.2-90B-Vision.

    Primary vision provider (chosen over Gemini after benchmarking: accurate,
    no hallucinations, and not subject to Gemini's 20/day free-tier quota).
    Raises on any technical failure (missing key, non-200, timeout) so
    process_input() can fall back to Gemini; returns a cleaned comma-separated
    food list, or a friendly no-food message, on success.
    """
    import requests

    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY not set")

    img_b64 = _downscale_image_b64(image_path)

    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
    payload = {
        "model": NVIDIA_VISION_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": _FOOD_PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
        ]}],
        "max_tokens": 512,
        "temperature": 0.2,
        "top_p": 1.0,
        "stream": False,
    }

    response = requests.post(NVIDIA_INVOKE_URL, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"NVIDIA API returned {response.status_code}: {response.text[:120]}")

    content = response.json()["choices"][0]["message"]["content"].strip()

    # Clean the model output into a bare comma list for the downstream parser:
    # drop markdown, strip any "Here is the list:" style preamble, collapse
    # newlines, and trim a trailing period.
    content = re.sub(r'[*`#]', '', content).strip()
    if ":" in content:
        after = content.split(":")[-1].strip()
        if "," in after:
            content = after
    content = content.replace("\n", " ").strip().strip(".").strip()

    if not content:
        return "❌ No food items detected in this image. Try a clearer photo of your meal."
    return content


def extract_foods_with_gemini(image_path):
    """Extract food items from image using Gemini (fallback vision provider)."""
    try:
        import google.generativeai as genai
        from PIL import Image

        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Google API key not found in environment variables")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        image = Image.open(image_path)

        response = model.generate_content([_FOOD_PROMPT, image])

        # Gemini can return a response with no usable Part (e.g. non-food images,
        # or content it declines to describe) — response.text then raises a raw
        # SDK exception. Detect that case explicitly instead of leaking it to users.
        if not response.candidates or not response.candidates[0].content.parts:
            return "❌ No food items detected in this image. Try a clearer photo of your meal."

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
            print("Extracting food items from uploaded image...")
            # Use tempfile for safe temporary file handling
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(uploaded_file.getvalue())
                temp_path = temp_file.name

            try:
                # Primary: NVIDIA Llama-3.2-90B-Vision. Fall back to Gemini on
                # any technical failure (missing key, timeout, non-200) so a
                # single-provider outage or quota wall doesn't break extraction.
                try:
                    return extract_foods_with_nvidia(temp_path)
                except Exception as e:
                    print(f"NVIDIA vision extraction failed ({e}); falling back to Gemini.")
                    return extract_foods_with_gemini(temp_path)
            finally:
                # Ensure temp file is deleted even if extraction fails
                try:
                    os.unlink(temp_path)
                except:
                    pass  # Ignore deletion errors

        elif input_data and isinstance(input_data, str):
            print("Extracting food items from text...")
            extracted_text = extract_foods_from_text(input_data)
            return extracted_text
        else:
            return "❌ No valid input provided"

    except Exception as e:
        return f"❌ Error in process_input: {e}"


