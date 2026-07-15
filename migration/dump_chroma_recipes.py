"""
One-off migration utility: dumps all recipes (id, metadata, document text,
embedding) out of the local ChromaDB store (chroma_recipe_db) into an NDJSON
file, so the Node-side import script can bulk-insert them into MongoDB Atlas
without needing a Python<->Node bridge or a new pymongo dependency.

Does not modify chroma_recipe_db in any way — read-only.
"""
import json
import time

import chromadb

CHROMA_PATH = r"C:\Ai_Nutritionist\chroma_recipe_db"
OUTPUT_PATH = r"C:\Ai_Nutritionist\migration\recipes_dump.ndjson"
BATCH_SIZE = 2000


def main():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection("recipes")
    total = collection.count()
    print(f"Source collection 'recipes' has {total} records.")

    written = 0
    skipped = []
    t_start = time.time()

    with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
        offset = 0
        while offset < total:
            batch = collection.get(
                limit=BATCH_SIZE,
                offset=offset,
                include=["embeddings", "documents", "metadatas"],
            )
            ids = batch["ids"]
            embeddings = batch["embeddings"]
            documents = batch["documents"]
            metadatas = batch["metadatas"]

            for i in range(len(ids)):
                recipe_id = ids[i]
                embedding = embeddings[i]
                # ChromaDB returns embeddings as numpy arrays, not JSON-serializable as-is
                embedding = embedding.tolist() if embedding is not None else None
                document = documents[i]
                metadata = metadatas[i] or {}

                if embedding is None or len(embedding) != 384:
                    skipped.append((recipe_id, f"bad embedding (len={len(embedding) if embedding is not None else None})"))
                    continue
                if not document:
                    skipped.append((recipe_id, "missing document text"))
                    continue

                record = {
                    "recipeId": recipe_id,
                    "title": metadata.get("title", ""),
                    "source": metadata.get("source", ""),
                    "link": metadata.get("link", ""),
                    "documentText": document,
                    "embedding": embedding,
                }
                out.write(json.dumps(record) + "\n")
                written += 1

            offset += BATCH_SIZE
            elapsed = time.time() - t_start
            print(f"  processed {min(offset, total)}/{total} ({elapsed:.1f}s elapsed)")

    print(f"\nDone in {time.time()-t_start:.1f}s. Wrote {written} records to {OUTPUT_PATH}.")
    print(f"Skipped {len(skipped)} records.")
    if skipped:
        print("Skipped records (id, reason):")
        for rid, reason in skipped[:20]:
            print(f"  - {rid}: {reason}")
        if len(skipped) > 20:
            print(f"  ...and {len(skipped) - 20} more")


if __name__ == "__main__":
    main()
