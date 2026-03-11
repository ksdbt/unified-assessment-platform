const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/user');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await User.User.countDocuments({});
        console.log(`📊 Total Users: ${count}`);

        if (count > 0) {
            const users = await User.User.find({}, 'name email role').limit(5);
            console.log('👤 Existing Users (First 5):');
            users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Check FAILED:', err.message);
        process.exit(1);
    }
};

checkUsers();
