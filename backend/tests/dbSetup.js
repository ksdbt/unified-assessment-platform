const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

exports.connectDB = async () => {
    if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
    }
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
};

exports.disconnectDB = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null; // Reset singleton
    }
};

exports.clearDB = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};
