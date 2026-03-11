const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/user');
const Assessment = require('./models/Assessment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uap_test';

async function test() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected');

        let instructor = await User.getUserByEmail('instructor@test.com');
        if (!instructor) {
            instructor = await User.createUser({
                name: 'Test Instructor',
                email: 'instructor@test.com',
                password: 'password123',
                role: 'instructor'
            });
        }

        const assessmentData = {
            title: 'Debug Assessment',
            subject: 'Debug',
            duration: 30,
            instructorId: instructor._id,
            instructorName: instructor.name,
            totalMarks: 100,
            questions: [
                { question: 'Q1', type: 'mcq', options: ['A', 'B'], correctAnswer: 'A', points: 40 },
                { question: 'Q2', type: 'long_answer', points: 60 }
            ]
        };

        console.log('Creating assessment...');
        const assessment = await Assessment.Assessment.create(assessmentData);
        console.log('Success:', assessment._id);
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        if (err.errors) {
            console.error('Validation Errors:', JSON.stringify(err.errors, null, 2));
        }
        process.exit(1);
    }
}

test();
