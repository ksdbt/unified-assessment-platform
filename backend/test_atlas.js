const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
    try {
        console.log('📡 Testing connection to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Port/Auth SUCCESS: Connected to MongoDB Atlas.');

        const dbName = mongoose.connection.db.databaseName;
        console.log(`📂 Database Name: ${dbName}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📊 Found ${collections.length} collections.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection FAILED:', err.message);
        process.exit(1);
    }
};

testConnection();
