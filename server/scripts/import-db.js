const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from server root or project root
const envPath = fs.existsSync(path.resolve(__dirname, '../../.env'))
  ? path.resolve(__dirname, '../../.env')
  : path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';
const exportDir = path.resolve(__dirname, '../database_export');

function transformDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (Array.isArray(doc)) return doc.map(transformDoc);

  const transformed = {};
  for (const [key, val] of Object.entries(doc)) {
    if (val === null || val === undefined) {
      transformed[key] = val;
    } else if (key === '_id' && typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
      transformed[key] = new mongoose.Types.ObjectId(val);
    } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(val)) {
      transformed[key] = new Date(val);
    } else if (typeof val === 'object' && val !== null) {
      if (val.$oid) {
        transformed[key] = new mongoose.Types.ObjectId(val.$oid);
      } else if (val.$date) {
        transformed[key] = new Date(val.$date);
      } else {
        transformed[key] = transformDoc(val);
      }
    } else {
      transformed[key] = val;
    }
  }
  return transformed;
}

async function runImport() {
  console.log('='.repeat(60));
  console.log('  TiffinLink Database Import Script');
  console.log('='.repeat(60));
  console.log(`Connecting to: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected successfully to database: "${mongoose.connection.name}"\n`);

    const db = mongoose.connection.db;

    if (!fs.existsSync(exportDir)) {
      throw new Error(`Export directory not found at: ${exportDir}`);
    }

    const files = fs.readdirSync(exportDir).filter(
      file => file.endsWith('.json') && file !== 'full_database_dump.json'
    );

    let totalCollections = 0;
    let totalDocuments = 0;

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(exportDir, file);

      let data;
      try {
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (!raw) {
          data = [];
        } else {
          data = JSON.parse(raw);
        }
      } catch (err) {
        console.warn(`[SKIP] Could not parse ${file}: ${err.message}`);
        continue;
      }

      if (!Array.isArray(data)) {
        console.warn(`[SKIP] ${file} does not contain a JSON array.`);
        continue;
      }

      const collection = db.collection(collectionName);

      // Clean existing data in this collection
      await collection.deleteMany({});

      if (data.length > 0) {
        const transformedData = data.map(transformDoc);
        const result = await collection.insertMany(transformedData, { ordered: false });
        console.log(`[OK] Imported ${result.insertedCount} document(s) into "${collectionName}"`);
        totalDocuments += result.insertedCount;
      } else {
        console.log(`[OK] Initialized empty collection "${collectionName}"`);
      }

      totalCollections++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Summary: Imported ${totalDocuments} total documents across ${totalCollections} collections.`);
    console.log('Database setup complete!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n[ERROR during import]:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runImport();
