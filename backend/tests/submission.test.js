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

jest.mock('../services/aiService', () => ({
    evaluateResponse: jest.fn().mockResolvedValue({
        isCorrect: true,
        points: 10,
        feedback: 'Excellent answer'
    })
}));

let instructorToken;
let studentToken;
let instructorId;
let studentId;
let assessmentId;
let questionId;

jest.setTimeout(30000);

beforeAll(async () => {
    await connectDB();

    // Setup roles
    const instructorRes = await request(app).post('/api/auth/register').send({
        name: 'Sub Instructor',
        email: 'sub_inst@test.com',
        password: 'password123',
        role: 'instructor'
    });
    instructorToken = instructorRes.body.token;

    const studentRes = await request(app).post('/api/auth/register').send({
        name: 'Sub Student',
        email: 'sub_stud@test.com',
        password: 'password123',
        role: 'student'
    });
    studentToken = studentRes.body.token;

    // Create an assessment to submit to
    const assRes = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
            title: 'Submission Test Exam',
            subject: 'Testing',
            type: 'mcq',
            status: 'active',
            duration: 30,
            questions: [
                {
                    question: 'Is this a test?',
                    type: 'mcq',
                    options: ['Yes', 'No'],
                    correctAnswer: 'Yes',
                    points: 10
                }
            ]
        });
    assessmentId = assRes.body.data._id;
    questionId = assRes.body.data.questions[0]._id;
}, 60000);

afterAll(async () => await disconnectDB());

describe('Submission Controller', () => {
    let submissionId;

    test('Student should be able to submit an assessment', async () => {
        const answers = {};
        answers[questionId] = 'Yes';

        const res = await request(app)
            .post('/api/submissions')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                assessmentId: assessmentId,
                answers: answers,
                timeTaken: 10,
                anomalyMetrics: {
                    tabSwitches: 0,
                    copyPastes: 0,
                    questionTimes: { [questionId]: 10 }
                }
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('evaluated'); // MCQ is auto-evaluated
        expect(res.body.data.totalScore).toBe(10);
        submissionId = res.body.data._id;
    });

    test('Instructor should be able to view submissions for their assessment', async () => {
        const res = await request(app)
            .get(`/api/submissions/assessment/${assessmentId}`)
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Student should be able to see their own submissions', async () => {
        const res = await request(app)
            .get('/api/submissions/student')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.some(s => s._id.toString() === submissionId.toString())).toBe(true);
    });
});
