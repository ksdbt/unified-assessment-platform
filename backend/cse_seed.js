const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('./models/user');
const Assessment = require('./models/Assessment');
const Submission = require('./models/Submission');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assessment-platform';

const seed = async () => {
    try {
        console.log('📡 Connecting to MongoDB for CSE Project Seeding...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        // 0. Cleanup
        console.log('🧹 Cleaning up old data...');
        await Promise.all([
            User.User.deleteMany({}),
            Assessment.Assessment.deleteMany({}),
            Submission.Submission.deleteMany({}),
            ActivityLog.ActivityLog.deleteMany({}),
            Notification.Notification.deleteMany({})
        ]);

        // 1. Create Roles with STATIC IDs to maintain session validity across re-seeds
        console.log('👤 Creating Users (Instructor & students)...');
        const instructor = await User.createUser({
            _id: new mongoose.Types.ObjectId('65e89a2b5f3a2c1d4e5f6a7b'),
            name: 'Dr. Smith (HOD CSE)',
            email: 'smith@cse.edu',
            password: 'password123',
            role: 'instructor',
            instituteCode: 'CSE001',
            profile: { department: 'Computer Science', experience: 15 }
        });

        const student1 = await User.createUser({
            _id: new mongoose.Types.ObjectId('65e89a2b5f3a2c1d4e5f6a8c'),
            name: 'Alice (CSE Student)',
            email: 'alice@student.cse',
            password: 'password123',
            role: 'student',
            instituteCode: 'CSE2024-001'
        });

        const student2 = await User.createUser({
            _id: new mongoose.Types.ObjectId('65e89a2b5f3a2c1d4e5f6a9d'),
            name: 'Bob (CSE Student)',
            email: 'bob@student.cse',
            password: 'password123',
            role: 'student',
            instituteCode: 'CSE2024-002'
        });

        const admin = await User.createUser({
            _id: new mongoose.Types.ObjectId('65e89a2b5f3a2c1d4e5f6aae'),
            name: 'Super Admin',
            email: 'admin@uap.com',
            password: 'admin123',
            role: 'admin'
        });

        // 2. Create CSE Assessments
        console.log('📝 Creating Operating Systems MCQ Assessment...');
        const osTest = await Assessment.createAssessment({
            title: 'Operating Systems - Unit 1 Quiz',
            subject: 'Operating Systems',
            description: 'Covers Process Management, Scheduling and Deadlocks.',
            duration: 30,
            totalMarks: 20,
            instructorId: instructor._id,
            status: 'active',
            questions: [
                {
                    question: 'Which scheduling algorithm results in the maximum throughput?',
                    type: 'mcq',
                    options: ['FIFO', 'SJF', 'Round Robin', 'Priority'],
                    correctAnswer: 'SJF',
                    points: 5
                },
                {
                    question: 'What is a semaphore?',
                    type: 'mcq',
                    options: ['A hardware sync tool', 'An integer variable used for signaling', 'A process state', 'A memory allocation unit'],
                    correctAnswer: 'An integer variable used for signaling',
                    points: 5
                }
            ]
        });

        console.log('💻 Creating Data Structures Coding Assessment...');
        const dsTest = await Assessment.createAssessment({
            title: 'Data Structures - Coding Lab',
            subject: 'Data Structures',
            description: 'Implement core algorithms in JavaScript/Python.',
            duration: 90,
            passingScore: 25,
            totalMarks: 50,
            instructorId: instructor._id,
            status: 'active',
            questions: [
                {
                    question: 'Write a function to reverse a Singly Linked List.',
                    type: 'coding',
                    language: 'javascript',
                    initialCode: 'function reverseList(head) {\n  // Your code here\n}',
                    testCases: [
                        { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }
                    ],
                    points: 25
                }
            ]
        });

        // 3. Normal Submission (Alice)
        console.log('✅ Alice attending OS Quiz (Normal Flow)...');
        const aliceSubmission = await Submission.createSubmission({
            assessmentId: osTest._id,
            studentId: student1._id,
            studentName: student1.name,
            status: 'evaluated',
            answers: [
                { questionId: osTest.questions[0]._id, answer: 'SJF', isCorrect: true, points: 5 },
                { questionId: osTest.questions[1]._id, answer: 'An integer variable used for signaling', isCorrect: true, points: 5 }
            ],
            totalScore: 10,
            maxScore: 20,
            percentage: 50,
            difficulty: 'beginner',
            riskScore: 0
        });

        // 4. Anomaly Submission (Bob)
        console.log('⚠️ Bob attending DS Lab (Anomaly Detected Flow)...');
        const bobSubmission = await Submission.createSubmission({
            assessmentId: dsTest._id,
            studentId: student2._id,
            studentName: student2.name,
            difficulty: 'intermediate',
            answers: [
                { questionId: dsTest.questions[0]._id, answer: 'function reverseList(head) { ... }' }
            ],
            riskScore: 85,
            riskLevel: 'High',
            anomalyMetrics: {
                tabSwitches: 12,
                copyPastes: 5,
                timeDeviation: 0,
                ipChanges: 0
            },
            behaviorLogs: [
                { event: 'TAB_SWITCH', details: 'Candidate switched to Browser for search' },
                { event: 'COPY_PASTE', details: 'Candidate pasted code snippet from external source' }
            ]
        });

        // 5. Audit Log (Integrity Check)
        console.log('🔐 Generating Audit Logs...');
        const LoggingEngine = require('./services/LoggingEngine');
        const mockReq = {
            user: { _id: instructor._id, id: instructor._id, name: instructor.name, role: instructor.role },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'Seed-Script' }
        };
        const log1 = await LoggingEngine.log(
            mockReq,
            'ASSESSMENT_CREATED',
            'Operating Systems MCQ Assessment created',
            {},
            osTest._id
        );

        console.log('Done! CSE Project seeded to MongoDB.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
