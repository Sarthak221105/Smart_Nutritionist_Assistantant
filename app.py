import streamlit as st
from nutrition_info import analyze_meal
from text_extraction import process_input
from llm_model import ai_nutritionist

# --------------------------
# Streamlit Page Setup
# --------------------------
st.set_page_config(
    page_title="AI Nutritionist",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🥗 Your Nutritionist Assistant")
st.markdown("Get **nutrition insights** or **AI-powered meal recommendations** based on your ingredients.")

# --------------------------
# Sidebar - User Info
# --------------------------
st.sidebar.header("👤 User Preferences")

goal = st.sidebar.selectbox("Goal", ["Lose Weight", "Maintain Weight", "Gain Weight"])
diet = st.sidebar.selectbox("Diet Type", ["Vegetarian", "Vegan", "Non-Vegetarian"])

# Additional preferences
st.sidebar.header("🎯 Additional Preferences")
dietary_restrictions = st.sidebar.multiselect(
    "Dietary Restrictions",
    ["Low-carb", "High-protein", "Gluten-free", "Dairy-free", "Low-fat", "Keto"]
)

allergies = st.sidebar.multiselect(
    "Allergies",
    ["Nuts", "Dairy", "Eggs", "Seafood", "Soy", "Wheat"]
)

cuisine_preference = st.sidebar.selectbox(
    "Cuisine Preference",
    ["Any", "Mediterranean", "Asian", "Mexican", "Italian", "Indian"]
)

# --------------------------
# Input Section
# --------------------------
st.subheader("🍱 Enter Your Ingredients")

input_mode = st.radio("Choose input method:", ["📝 Type Ingredients", "📷 Upload Meal Image"])

meal_text = None
uploaded_file = None

if input_mode == "📝 Type Ingredients":
    meal_text = st.text_area(
        "List your ingredients (comma separated):",
        placeholder="e.g., banana, milk, rice, chicken breast, spinach, eggs...",
        height=100
    )

    # Quick examples
    with st.expander("💡 Quick Examples"):
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("Breakfast"):
                st.session_state.meal_text = "oats, milk, banana, honey, almonds"
        with col2:
            if st.button("Lunch"):
                st.session_state.meal_text = "chicken breast, rice, broccoli, olive oil"
        with col3:
            if st.button("Dinner"):
                st.session_state.meal_text = "salmon, quinoa, asparagus, lemon"

    # Load from session state if available
    if hasattr(st.session_state, 'meal_text'):
        meal_text = st.session_state.meal_text
else:
    uploaded_file = st.file_uploader(
        "Upload your meal image",
        type=["jpg", "jpeg", "png"],
        help="Upload an image of your meal for analysis"
    )
    if uploaded_file:
        st.image(uploaded_file, caption="Uploaded Meal Image", width=300)

# --------------------------
# Analysis Buttons
# --------------------------
st.markdown("---")
col1, col2, col3 = st.columns([1, 1, 2])

with col1:
    get_nutrition = st.button("🔍 Get Nutrition Info", use_container_width=True)

with col2:
    get_ai_answer = st.button("🤖 AI Recommendation", use_container_width=True)

# --------------------------
# Process Input
# --------------------------
if get_nutrition or get_ai_answer:
    if not meal_text and not uploaded_file:
        st.warning("⚠️ Please type ingredients or upload a meal image first.")
    else:
        try:
            with st.spinner("🔍 Extracting food items..."):
                # Get extracted text from process_input
                extracted_text = process_input(
                    input_data=meal_text,
                    uploaded_file=uploaded_file
                )

            # Check if extraction was successful
            if extracted_text.startswith("❌"):
                st.error(extracted_text)
            else:
                st.success(f"Extracted foods: {extracted_text}")

                # Convert extracted text to list for display
                detected_foods = [food.strip() for food in extracted_text.split(",") if food.strip()]

                # Nutrition Analysis
                if get_nutrition:
                    st.markdown("---")
                    st.subheader("📊 Nutrition Analysis")

                    with st.spinner("⚡ Analyzing nutrition..."):
                        nutrition_summary = analyze_meal(extracted_text)

                    st.markdown("#### 🥦 Nutritional Information")
                    st.text_area("Nutrition Details", nutrition_summary, height=200)

                # AI Recommendation
                if get_ai_answer:
                    st.markdown("---")
                    st.subheader("💡 AI Personalized Recommendations")

                    with st.spinner("🤖 Generating AI recommendations..."):
                        try:
                            goal_mapping = {
                                "Lose Weight": "lose",
                                "Maintain Weight": "maintain",
                                "Gain Weight": "gain"
                            }
                            diet_mapping = {
                                "Vegetarian": "vegetarian",
                                "Vegan": "vegan",
                                "Non-Vegetarian": "non-veg"
                            }

                            full_response = ai_nutritionist(
                                user_input=extracted_text,
                                goal=goal_mapping[goal],
                                food_type=diet_mapping[diet],
                                dietary_restrictions=[r.lower() for r in dietary_restrictions],
                                allergies=[a.lower() for a in allergies],
                                cuisine_preference=cuisine_preference.lower() if cuisine_preference != "Any" else None
                            )

                            st.markdown("#### 🎯 Your Personalized Plan")
                            st.write(full_response)

                        except Exception as e:
                            st.error(f"❌ Error generating AI recommendations: {str(e)}")

        except Exception as e:
            st.error(f"❌ An error occurred: {str(e)}")

# --------------------------
# Footer & Info
# --------------------------
st.markdown("---")
st.markdown("### 💡 How to get the best results:")
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    **🔍 Nutrition Info:**
    - Quick nutrition facts
    - Macronutrient breakdown
    - Calorie information
    """)

with col2:
    st.markdown("""
    **🤖 AI Recommendation:**
    - Personalized meal plans
    - Recipe suggestions
    - Goal-specific advice
    - Shopping lists
    """)

with col3:
    st.markdown("""
    **📝 Tips:**
    - Be specific with ingredients
    - Include quantities if known
    - Mention cooking methods
    """)