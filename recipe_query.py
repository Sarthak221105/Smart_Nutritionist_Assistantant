
# Lazy-loading module: nothing heavy is imported at module level
# This ensures the Flask server can start and bind to a port immediately
import os
from dotenv import load_dotenv

load_dotenv()

chroma_client = None
collection = None
model = None
mongo_client = None


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


def _get_recipe_collection():
    """Lazily connect to the migrated recipe corpus on MongoDB Atlas.

    Replaces the old local ChromaDB store (chroma_recipe_db), which is no
    longer queried here but is left fully intact on disk.
    """
    global mongo_client
    if mongo_client is None:
        from pymongo import MongoClient
        mongo_uri = os.getenv("MONGO_URI")
        mongo_client = MongoClient(mongo_uri)
    db = mongo_client.get_default_database()
    return db["recipeEmbeddings"]


_FALLBACK_MESSAGE = "No local recipes found. Suggest custom recipes based on these ingredients."


def search_recipe(query, top_k=5):
    """
    Semantic recipe search via MongoDB Atlas Vector Search, using the same
    384-dim sentence-transformers/all-MiniLM-L6-v2 embeddings originally
    computed into the local ChromaDB store and migrated into the
    `recipeEmbeddings` collection (see js_backend/migration/).
    """
    if not query or not isinstance(query, str):
        return _FALLBACK_MESSAGE

    try:
        model = _get_model()
        query_embedding = model.encode([query])[0].tolist()

        collection = _get_recipe_collection()
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "recipe_vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": max(top_k * 20, 100),
                    "limit": top_k,
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "title": 1,
                    "documentText": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        results = list(collection.aggregate(pipeline))
        if not results:
            return _FALLBACK_MESSAGE

        return "\n\n".join(r["documentText"] for r in results)

    except Exception as e:
        print(f"Error during recipe vector search: {e}")
        return _FALLBACK_MESSAGE