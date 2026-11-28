const request = require('supertest')
const app = require('../src/app')

const existingUser = {
    name: 'Rahul',
    email: 'rahul@mail.com',
    password: '12345678'
}

describe('Auth', () => {
    beforeAll(async () => {
        await request(app).post('/auth/register').send(existingUser)
    })

    describe('POST /auth/register', () => {
        it('creates a new user and does not return the password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ name: 'Aman', email: 'aman@mail.com', password: '12345678' })

            expect(res.status).toBe(201)
            expect(res.body.user.email).toBe('aman@mail.com')
            expect(res.body.user).not.toHaveProperty('password')
            expect(res.body.user).not.toHaveProperty('password_hash')
        })

        it('rejects a duplicate email', async () => {
            const res = await request(app).post('/auth/register').send(existingUser)

            expect(res.status).toBe(409)
            expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS')
        })

        it('treats emails as case-insensitive', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ ...existingUser, email: 'RAHUL@MAIL.COM' })

            expect(res.status).toBe(409)
        })
    })

    describe('POST /auth/login', () => {
        it('logs in with correct credentials and returns a token', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: existingUser.email, password: existingUser.password })

            expect(res.status).toBe(200)
            expect(typeof res.body.token).toBe('string')
            expect(res.body.user.email).toBe(existingUser.email)
            expect(res.body.user).not.toHaveProperty('password_hash')
        })

        it('rejects a wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: existingUser.email, password: 'wrong-password' })

            expect(res.status).toBe(401)
            expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
        })

        it('rejects an email that is not registered', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({ email: 'nobody@mail.com', password: '12345678' })

            expect(res.status).toBe(401)
            expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
        })
    })

    describe('Authentication middleware', () => {
        it('rejects a request without a token', async () => {
            const res = await request(app).get('/projects')

            expect(res.status).toBe(401)
            expect(res.body.error.code).toBe('UNAUTHORIZED')
        })

        it('rejects an invalid token', async () => {
            const res = await request(app)
                .get('/projects')
                .set('Authorization', 'Bearer not-a-real-token')

            expect(res.status).toBe(401)
        })
    })
})