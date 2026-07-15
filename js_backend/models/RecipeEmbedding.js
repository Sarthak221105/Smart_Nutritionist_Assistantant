import mongoose from "mongoose";

// Migrated recipe corpus for the Recipe RAG feature (see recipe_query.py).
// `embedding` holds the original 384-dim sentence-transformers/all-MiniLM-L6-v2
// vector carried over from the local ChromaDB store — not re-embedded.
const recipeEmbeddingSchema = new mongoose.Schema({
  recipeId: { type: String, required: true, unique: true },
  title: String,
  source: String,
  link: String,
  documentText: { type: String, required: true },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr) => arr.length === 384,
      message: "embedding must be exactly 384 dimensions",
    },
  },
});

const RecipeEmbedding = mongoose.model("RecipeEmbedding", recipeEmbeddingSchema, "recipeEmbeddings");
export default RecipeEmbedding;
