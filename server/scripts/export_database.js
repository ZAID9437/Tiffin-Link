const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function exportDatabase() {
    try {
        console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log(`Found ${collections.length} collections.`);
        
        const exportDir = path.join(__dirname, '../database_export');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fullDump = {};
        const summary = [];

        for (const colInfo of collections) {
            const colName = colInfo.name;
            const collection = db.collection(colName);
            const records = await collection.find({}).toArray();
            
            fullDump[colName] = records;
            
            // Save individual collection JSON file
            const filePath = path.join(exportDir, `${colName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
            
            console.log(`Exported ${records.length} records from '${colName}' -> database_export/${colName}.json`);
            summary.push({ collection: colName, count: records.length, file: `${colName}.json` });
        }

        // Save complete database dump file
        const fullDumpPath = path.join(exportDir, 'full_database_dump.json');
        fs.writeFileSync(fullDumpPath, JSON.stringify(fullDump, null, 2));

        console.log(`\nFull database export successfully saved to: ${fullDumpPath}`);
        console.table(summary);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error exporting database:', err);
        process.exit(1);
    }
}

exportDatabase();
