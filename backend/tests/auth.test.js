const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB, clearDB } = require('./dbSetup');
const { User } = require('../models/user');

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await disconnectDB());

describe('Authentication API', () => {
    test('Should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'student'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    test('Should login and retrieve JWT token', async () => {
        // Register first
        await request(app).post('/api/auth/register').send({
            name: 'Test Login User',
            email: 'login@test.com',
            password: 'password123',
            role: 'instructor'
        });

        // Attempt login
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@test.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('Should block login with incorrect password', async () => {
        await request(app).post('/api/auth/register').send({
            name: 'Test Instructor',
            email: 'instructor@test.com',
            password: 'password123',
            role: 'instructor'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'instructor@test.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
