import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkCount() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    // List all databases
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    
    console.log('\n=== ALL DATABASES ===');
    dbList.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('=====================\n');
    
    // Check each database for raw_materials collection
    for (const dbInfo of dbList.databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      const hasRawMaterials = collections.find(c => c.name === 'raw_materials');
      
      if (hasRawMaterials) {
        console.log(`\n📦 Found raw_materials in database: ${dbInfo.name}`);
        
        // Count active raw materials
        const activeCount = await db.collection('raw_materials').countDocuments({ 
          is_deleted: { $ne: true } 
        });
        
        // Count total raw materials
        const totalCount = await db.collection('raw_materials').countDocuments();
        
        // Count deleted raw materials
        const deletedCount = await db.collection('raw_materials').countDocuments({ 
          is_deleted: true 
        });
        
        console.log('\n=== RAW MATERIALS COUNT ===');
        console.log('Active Raw Materials:', activeCount);
        console.log('Deleted Raw Materials:', deletedCount);
        console.log('Total Raw Materials:', totalCount);
        console.log('===========================\n');
        
        // Get sample data
        if (activeCount > 0) {
          const samples = await db.collection('raw_materials')
            .find({ is_deleted: { $ne: true } })
            .limit(10)
            .toArray();
          
          console.log('Sample Raw Materials (first 10):');
          samples.forEach((rm, idx) => {
            console.log(`${idx + 1}. ${rm.code} - ${rm.name} (Category: ${rm.categoryName || 'N/A'})`);
          });
        }
        
        // Check other collections
        console.log('\n=== OTHER COLLECTIONS ===');
        for (const col of collections) {
          const count = await db.collection(col.name).countDocuments();
          console.log(`${col.name}: ${count} documents`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkCount();
