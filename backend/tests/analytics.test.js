const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB, clearDB } = require('./dbSetup');
const Submission = require('../models/Submission');
const { User } = require('../models/user');
const mongoose = require('mongoose');

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await disconnectDB());

let instructorToken;
let student1;
let student2;

beforeEach(async () => {
    // Generate valid instructor
    const instRes = await request(app).post('/api/auth/register').send({
        name: 'Analytics Instructor',
        email: 'analytics@test.com',
        password: 'password123',
        role: 'instructor'
    });
    instructorToken = instRes.body.token;

    // Generate two students in raw DB
    student1 = await User.create({ name: 'S1', email: 's1@test.com', password: 'password123', role: 'student' });
    student2 = await User.create({ name: 'S2', email: 's2@test.com', password: 'password123', role: 'student' });
});

describe('Analytics API Engine (Collusion Graph)', () => {

    test('Should return an empty nodes/links array if less than 2 submissions exist', async () => {
        const assessmentId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .get(`/api/analytics/collusion/${assessmentId}`)
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.nodes.length).toBe(0);
        expect(res.body.links.length).toBe(0);
    });

    test('Should accurately detect collusion (Jaccard > 85%) on matching answers', async () => {
        const assessmentId = new mongoose.Types.ObjectId().toString();

        // 1. Seed idential submissions
        const dummyAnswers = [
            { questionId: 'q1', answer: 'A' },
            { questionId: 'q2', answer: ['A', 'B'] }, // Multi choice identical
            { questionId: 'q3', answer: 'Short essay copied here' }
        ];

        await Submission.createSubmission({ assessmentId, studentId: student1._id, answers: dummyAnswers });
        await Submission.createSubmission({ assessmentId, studentId: student2._id, answers: dummyAnswers });

        // 2. Query Analytics Graph Endpoint
        const res = await request(app)
            .get(`/api/analytics/collusion/${assessmentId}`)
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.statusCode).toBe(200);

        // Assert Node Generation
        expect(res.body.nodes.length).toBe(2);
        const nodeIds = res.body.nodes.map(n => n.id);
        expect(nodeIds).toContain(student1._id.toString());

        // Assert Link Generation (Collusion Link)
        expect(res.body.links.length).toBe(1); // One edge bridging the two students
        const link = res.body.links[0];

        // The similarity between identical arrays/sets is precisely 1.0 (100%)
        expect(parseFloat(link.similarity)).toBeGreaterThan(0.85);
    });

    test('Should NOT link students if Jaccard similarity is low', async () => {
        const assessmentId = new mongoose.Types.ObjectId().toString();

        // Seed totally different submissions
        const answers1 = [{ questionId: 'q1', answer: 'A' }, { questionId: 'q2', answer: 'B' }];
        const answers2 = [{ questionId: 'q1', answer: 'C' }, { questionId: 'q2', answer: 'D' }];

        await Submission.createSubmission({ assessmentId, studentId: student1._id, answers: answers1 });
        await Submission.createSubmission({ assessmentId, studentId: student2._id, answers: answers2 });

        const res = await request(app)
            .get(`/api/analytics/collusion/${assessmentId}`)
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.nodes.length).toBe(2);
        expect(res.body.links.length).toBe(0); // NO EDGE CREATED
    });

});
