
# Lazy-loading module: nothing heavy is imported at module level
# This ensures the Flask server can start and bind to a port immediately

chroma_client = None
collection = None
model = None


def _get_chroma_collection():
    """Lazily initialize ChromaDB client and collection."""
    global chroma_client, collection
    if collection is not None:
        return collection

    import chromadb

    try:
        chroma_client = chromadb.PersistentClient(path="./chroma_recipe_db")
    except Exception:
        print("PersistentClient failed, using EphemeralClient (no local recipe data)")
        chroma_client = chromadb.EphemeralClient()

    try:
        collection = chroma_client.get_collection("recipes")
    except Exception as e:
        print(f"Collection 'recipes' not found. Creating placeholder. Error: {e}")
        collection = chroma_client.get_or_create_collection("recipes")

    return collection


def _get_model():
    """Lazily load SentenceTransformer model."""
    global model
    if model is None:
        print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model


def search_recipe(query, top_k=5):
    # Bypass local ChromaDB/SentenceTransformer vector search on Render to prevent OOM (512MB limit)
    # Gemini will dynamically generate high-quality recipes instead.
    return "No local recipes found. Suggest custom recipes based on these ingredients."