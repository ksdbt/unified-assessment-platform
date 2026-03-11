const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createUser } = require('./models/user');

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB for User Seeding...');

        const userData = {
            name: 'Alice Student',
            email: 'alice@student.cse',
            password: 'password123',
            role: 'student',
            instituteCode: 'CSE001',
            profile: {
                department: 'B.E Computer Science',
                bio: 'Final year student specializing in Cloud Computing.'
            }
        };

        // Check if user exists
        const existing = await mongoose.model('User').findOne({ email: userData.email });
        if (existing) {
            console.log('👤 User Alice already exists in Atlas.');
        } else {
            await createUser(userData);
            console.log('✅ Created User: Alice (alice@student.cse / password123)');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ User seeding failed:', err);
        process.exit(1);
    }
};

seedUser();
