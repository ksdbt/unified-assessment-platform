const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');

dotenv.config();

const categories = [
    {
        name: 'Academic',
        description: 'Educational quizzes covering various academic subjects.',
        icon: 'BookOutlined',
        color: '#4f46e5',
        subcategories: ['Computer Science', 'Mathematics', 'Physics', 'History']
    },
    {
        name: 'Entertainment',
        description: 'Fun quizzes about movies, music, and pop culture.',
        icon: 'RocketOutlined',
        color: '#ec4899',
        subcategories: ['Movies', 'Music', 'Gaming', 'Comics']
    },
    {
        name: 'General Knowledge',
        description: 'Test your knowledge on a wide range of topics.',
        icon: 'GlobalOutlined',
        color: '#10b981',
        subcategories: ['Current Affairs', 'Geography', 'Sports', 'Science']
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB for Category Seeding...');

        // Clear existing
        await Category.deleteMany({});
        await Subcategory.deleteMany({});
        console.log('🧹 Cleared old categories.');

        for (const catData of categories) {
            const category = await Category.create({
                name: catData.name,
                description: catData.description,
                icon: catData.icon,
                color: catData.color
            });

            console.log(`✅ Created Category: ${category.name}`);

            for (const subName of catData.subcategories) {
                await Subcategory.create({
                    name: subName,
                    categoryId: category._id,
                    description: `All about ${subName}`
                });
            }
            console.log(`   - Added ${catData.subcategories.length} subcategories.`);
        }

        console.log('🎉 Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedCategories();
