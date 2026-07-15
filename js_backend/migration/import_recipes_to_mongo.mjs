// One-off migration: streams migration/recipes_dump.ndjson (produced by
// dump_chroma_recipes.py) and bulk-inserts each recipe into the new
// RecipeEmbedding collection in MongoDB Atlas. Does not touch any existing
// collection. Safe to re-run — duplicate recipeIds are skipped, not treated
// as fatal errors.
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import RecipeEmbedding from "../models/RecipeEmbedding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const DUMP_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "..", "..", "migration", "recipes_dump.ndjson");
const BATCH_SIZE = 1000;

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const existingCount = await RecipeEmbedding.countDocuments();
  console.log(`RecipeEmbedding collection currently has ${existingCount} documents.`);

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH),
    crlfDelay: Infinity,
  });

  let batch = [];
  let attempted = 0;
  let inserted = 0;
  let duplicates = 0;
  let malformed = 0;
  const otherErrors = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    try {
      const result = await RecipeEmbedding.insertMany(batch, { ordered: false });
      inserted += result.length;
    } catch (err) {
      // insertMany with ordered:false still throws once at the end but reports
      // per-document results; err.insertedDocs / err.writeErrors give detail.
      const writeErrors = err.writeErrors || [];
      inserted += batch.length - writeErrors.length;
      for (const we of writeErrors) {
        if (we.code === 11000) {
          duplicates++;
        } else {
          otherErrors.push({ recipeId: batch[we.index]?.recipeId, message: we.errmsg || we.message });
        }
      }
    }
    batch = [];
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    attempted++;
    let record;
    try {
      record = JSON.parse(line);
    } catch (e) {
      malformed++;
      continue;
    }
    if (!record.recipeId || !record.documentText || !Array.isArray(record.embedding) || record.embedding.length !== 384) {
      malformed++;
      continue;
    }
    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      if (attempted % 10000 === 0) console.log(`  processed ${attempted}, inserted ${inserted} so far...`);
    }
  }
  await flushBatch();

  console.log("\n=== MIGRATION SUMMARY ===");
  console.log(`Records read from dump file: ${attempted}`);
  console.log(`Successfully inserted: ${inserted}`);
  console.log(`Skipped as duplicates (already present): ${duplicates}`);
  console.log(`Malformed/skipped (bad shape): ${malformed}`);
  if (otherErrors.length) {
    console.log(`Other write errors: ${otherErrors.length}`);
    console.log(otherErrors.slice(0, 20));
  }

  const finalCount = await RecipeEmbedding.countDocuments();
  console.log(`\nFinal RecipeEmbedding collection count: ${finalCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
