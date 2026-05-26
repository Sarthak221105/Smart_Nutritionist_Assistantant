import chromadb
from sentence_transformers import SentenceTransformer

# Initialize Chroma
try:
    chroma_client = chromadb.PersistentClient(path="./chroma_recipe_db")
except Exception:
    print("PersistentClient failed, using EphemeralClient (no local recipe data)")
    chroma_client = chromadb.EphemeralClient()

collection = None
try:
    collection = chroma_client.get_collection("recipes")
except Exception as e:
    print(f"Collection 'recipes' not found. Creating placeholder. Error: {e}")
    collection = chroma_client.get_or_create_collection("recipes")

# Lazy load SentenceTransformer model to prevent server startup timeouts
model = None

def get_model():
    global model
    if model is None:
        print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model


def search_recipe(query, top_k=5):
    if not collection:
        return "No recipes database found."

    # Lazy load the transformer model
    transformer_model = get_model()
    
    # Create embedding for query
    embedding = transformer_model.encode(query)

    # Query ChromaDB
    try:
        results = collection.query(
            query_embeddings=[embedding.tolist()],
            n_results=top_k
        )
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")
        return "No recipes found."

    if not results.get("documents") or not results["documents"][0]:
        print("No similar recipes found.")
        return "No recipes found."

    # Format results properly
    formatted_results = []
    for i in range(len(results["documents"][0])):
        title = results["metadatas"][0][i].get('title', 'Untitled Recipe')
        document = results["documents"][0][i]
        link = results["metadatas"][0][i].get('link', 'No link available')

        formatted_results.append(f"""
Recipe {i + 1}: {title}
Ingredients & Directions: {document[:200]}...
Link: {link}
""")

    return "\n".join(formatted_results)