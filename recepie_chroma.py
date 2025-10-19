import os
import pandas as pd
import chromadb
from chromadb.config import Settings
from tqdm import tqdm
from sentence_transformers import SentenceTransformer


DATA_PATH = "dataset/full_dataset.csv"
MAX_RECORDS = 80000
BATCH_SIZE = 1000
PERSIST_DIR = "./chroma_recipe_db"



client = chromadb.PersistentClient(path=PERSIST_DIR)
collection = client.get_or_create_collection("recipes")



model = SentenceTransformer("all-MiniLM-L6-v2")



df = pd.read_csv(DATA_PATH)
df = df.dropna(subset=["title", "ingredients", "directions"])
df = df.head(MAX_RECORDS).reset_index(drop=True)

print(f"Loaded {len(df)} recipes to process.\n")


def add_batch(batch_df, start_index):
    ids, docs, metas = [], [], []

    for idx, row in batch_df.iterrows():
        recipe_id = f"recipe_{start_index + idx}"  # Simple unique ID

        doc_text = f"Title: {row['title']}\nIngredients: {row['ingredients']}\nDirections: {row['directions']}"
        ids.append(recipe_id)
        docs.append(doc_text)
        metas.append({
            "source": "recipe_dataset",
            "link": row.get("link", ""),
            "title": row["title"]
        })

    embeddings = model.encode(docs, show_progress_bar=False).tolist()

    collection.add(
        ids=ids,
        documents=docs,
        metadatas=metas,
        embeddings=embeddings
    )

# ---------- MAIN LOOP ----------
for i in tqdm(range(0, len(df), BATCH_SIZE)):
    batch = df.iloc[i:i + BATCH_SIZE]
    add_batch(batch, start_index=i)
