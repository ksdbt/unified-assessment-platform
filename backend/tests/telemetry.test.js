const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB, clearDB } = require('./dbSetup');
const ExamSession = require('../models/ExamSession');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await disconnectDB());

let studentToken;

beforeEach(async () => {
    // Generate a valid mock user for tests
    const res = await request(app).post('/api/auth/register').send({
        name: 'Telemetry Student',
        email: 'telemetry@test.com',
        password: 'password123',
        role: 'student'
    });
    console.log('Register Response:', res.body);
    studentToken = res.body.token;
});

describe('Telemetry API Engine', () => {

    test('Should penalize TAB_SWITCH accurately and create an ExamSession if it does not exist', async () => {
        const assessmentId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .post('/api/telemetry/event')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                assessmentId,
                action: 'TAB_SWITCH',
                details: { info: 'User left tab' }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.integrityScore).toBe(95); // Base 100 - 5 = 95

        // Assert session created
        const session = await ExamSession.findOne({ assessmentId });
        expect(session).not.toBeNull();
        expect(session.telemetry.tabSwitches).toBe(1);

        // Assert audit log created
        const log = await AuditLog.findOne({ assessmentId });
        expect(log).not.toBeNull();
        expect(log.action).toBe('TAB_SWITCH');
        expect(log.previousHash).toBe('GENESIS_BLOCK');
        expect(typeof log.currentHash).toBe('string');
    });

    test('Should verify cryptographic chain linking sequentially between two events', async () => {
        const assessmentId = new mongoose.Types.ObjectId().toString();

        // Fire Event 1
        await request(app)
            .post('/api/telemetry/event')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ assessmentId, action: 'COPY_PASTE' }); // -10 penalty

        // Fire Event 2
        const res2 = await request(app)
            .post('/api/telemetry/event')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ assessmentId, action: 'TAB_SWITCH' }); // -5 penalty

        expect(res2.body.integrityScore).toBe(85); // 100 - 15 = 85

        const logs = await AuditLog.find({ assessmentId }).sort({ timestamp: 1 });
        expect(logs.length).toBe(2);

        // Crucial requirement: Audit chains must mathematically link
        const firstLog = logs[0];
        const secondLog = logs[1];
        expect(secondLog.previousHash).toEqual(firstLog.currentHash);
    });
});
