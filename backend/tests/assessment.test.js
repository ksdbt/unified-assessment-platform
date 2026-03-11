const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB, clearDB } = require('./dbSetup');
const { User } = require('../models/user');
const Assessment = require('../models/Assessment');

jest.mock('../services/AQIEngine', () => ({
    inspectQuestions: jest.fn().mockResolvedValue({
        qualityScore: 95,
        feedback: ['Good quality questions'],
        recommendedChanges: []
    })
}));

jest.setTimeout(30000);

let instructorToken;
let studentToken;
let instructorId;
let studentId;

beforeAll(async () => {
    await connectDB();
    await clearDB();

    // Register instructor
    const instructorRes = await request(app).post('/api/auth/register').send({
        name: 'Test Instructor',
        email: 'instructor_test@test.com',
        password: 'password123',
        role: 'instructor'
    });
    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user?._id;

    // Register student
    const studentRes = await request(app).post('/api/auth/register').send({
        name: 'Test Student',
        email: 'student_test@test.com',
        password: 'password123',
        role: 'student'
    });
    studentToken = studentRes.body.token;
    studentId = studentRes.body.user?._id;
}, 60000);

afterAll(async () => await disconnectDB());

describe('Assessment Controller', () => {
    let assessmentId;

    test('Instructor should be able to create an assessment', async () => {
        const res = await request(app)
            .post('/api/assessments')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Unit Test Exam',
                description: 'Testing the test system',
                subject: 'Testing',
                type: 'mcq',
                duration: 30,
                status: 'active',
                questions: [
                    {
                        question: 'What is 2+2?',
                        type: 'mcq',
                        options: ['3', '4', '5'],
                        correctAnswer: '4',
                        points: 10
                    }
                ]
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Unit Test Exam');
        assessmentId = res.body.data._id;
    });

    test('Student should be able to list active assessments', async () => {
        const res = await request(app)
            .get('/api/assessments/student')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some(a => a._id.toString() === assessmentId.toString())).toBe(true);
    });

    test('Instructor should be able to see their created assessments', async () => {
        const res = await request(app)
            .get('/api/assessments/instructor')
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.some(a => a._id.toString() === assessmentId.toString())).toBe(true);
    });
});
