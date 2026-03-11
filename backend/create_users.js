const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/user');

dotenv.config({ path: path.join(__dirname, '.env') });

const createUsers = async () => {
    try {
        console.log('📡 Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        const usersData = [
            {
                name: 'Super Admin',
                email: 'admin@uap.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'Dr. Smith',
                email: 'smith@cse.edu',
                password: 'password123',
                role: 'instructor'
            },
            {
                name: 'Alice',
                email: 'alice@student.cse',
                password: 'password123',
                role: 'student'
            }
        ];

        for (const data of usersData) {
            const existing = await User.User.findOne({ email: data.email });
            if (!existing) {
                await User.createUser(data);
                console.log(`✅ Created: ${data.name} (${data.role})`);
            } else {
                console.log(`ℹ️ Already exists: ${data.name}`);
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILED:', err.message);
        process.exit(1);
    }
};

createUsers();
