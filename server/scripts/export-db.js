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

function formatDocument(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (Array.isArray(doc)) return doc.map(formatDocument);

  const formatted = {};
  for (const [key, val] of Object.entries(doc)) {
    if (val === null || val === undefined) {
      formatted[key] = val;
    } else if (val instanceof mongoose.Types.ObjectId) {
      formatted[key] = val.toString();
    } else if (val instanceof Date) {
      formatted[key] = val.toISOString();
    } else if (typeof val === 'object') {
      formatted[key] = formatDocument(val);
    } else {
      formatted[key] = val;
    }
  }
  return formatted;
}

async function runExport() {
  console.log('='.repeat(60));
  console.log('  TiffinLink Database Export Script');
  console.log('='.repeat(60));
  console.log(`Connecting to: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to database: "${mongoose.connection.name}"\n`);

    const db = mongoose.connection.db;

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const collections = await db.listCollections().toArray();
    const fullDump = {};
    let totalDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const docs = await db.collection(colName).find({}).toArray();
      const formattedDocs = docs.map(formatDocument);

      const filePath = path.join(exportDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(formattedDocs, null, 2), 'utf8');

      fullDump[colName] = formattedDocs;
      totalDocs += formattedDocs.length;
      console.log(`[EXPORTED] "${colName}" -> ${formattedDocs.length} document(s) saved to ${colName}.json`);
    }

    // Save full database dump
    const dumpPath = path.join(exportDir, 'full_database_dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(fullDump, null, 2), 'utf8');
    console.log(`[EXPORTED] Full dump saved to full_database_dump.json`);

    console.log('\n' + '='.repeat(60));
    console.log(`Summary: Exported ${totalDocs} documents across ${collections.length} collections.`);
    console.log(`Target directory: ${exportDir}`);
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n[ERROR during export]:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runExport();
