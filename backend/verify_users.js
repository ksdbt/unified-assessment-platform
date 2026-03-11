const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserModel = require('./models/user');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await UserModel.User.find({}, 'name email role');
        console.log('Found users:');
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
