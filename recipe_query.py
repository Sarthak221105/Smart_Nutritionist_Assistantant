import chromadb
from sentence_transformers import SentenceTransformer

# Initialize Chroma and model
chroma_client = chromadb.PersistentClient(path="./chroma_recipe_db")

try:
    collection = chroma_client.get_collection("recipes")
except:
    print("Collection 'recipes' not found.")
    exit()

model = SentenceTransformer("all-MiniLM-L6-v2")


def search_recipe(query, top_k=5):

    # Create embedding for query
    embedding = model.encode(query)

    # Query ChromaDB
    results = collection.query(
        query_embeddings=[embedding.tolist()],
        n_results=top_k
    )

    if not results["documents"] or not results["documents"][0]:
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