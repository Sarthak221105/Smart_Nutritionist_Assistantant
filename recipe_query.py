
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
    coll = _get_chroma_collection()
    if not coll:
        return "No recipes database found."

    # Lazy load the transformer model
    transformer_model = _get_model()

    # Create embedding for query
    embedding = transformer_model.encode(query)

    # Query ChromaDB
    try:
        results = coll.query(
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