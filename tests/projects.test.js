const request = require('supertest')
const app = require('../src/app')
const { createUserAndLogin, createProject } = require('./helpers')

const auth = (token) => ({ Authorization: `Bearer ${token}` })

describe('Projects and membership', () => {
    let owner
    let member
    let outsider

    beforeAll(async () => {
        owner = await createUserAndLogin('Owner', 'owner@mail.com')
        member = await createUserAndLogin('Member', 'member@mail.com')
        outsider = await createUserAndLogin('Outsider', 'outsider@mail.com')
    })

    describe('POST /projects', () => {
        it('creates a project; the creator becomes owner and member', async () => {
            const res = await request(app)
                .post('/projects')
                .set(auth(owner.token))
                .send({ name: 'Website', description: 'Redesign' })

            expect(res.status).toBe(201)
            expect(res.body.project.ownerId).toBe(owner.user.id)

            const list = await request(app).get('/projects').set(auth(owner.token))
            const ids = list.body.projects.map((p) => p.id)

            expect(ids).toContain(res.body.project.id)
        })

        it('rejects a blank project name', async () => {
            const res = await request(app)
                .post('/projects')
                .set(auth(owner.token))
                .send({ name: '   ' })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe('VALIDATION_ERROR')
        })
    })

    describe('GET /projects and GET /projects/:id', () => {
        it('does not list projects of other users', async () => {
            const project = await createProject(owner.token, 'Private')

            const res = await request(app).get('/projects').set(auth(outsider.token))
            const ids = res.body.projects.map((p) => p.id)

            expect(res.status).toBe(200)
            expect(ids).not.toContain(project.id)
        })

        it('forbids a non-member from viewing a project', async () => {
            const project = await createProject(owner.token)

            const res = await request(app)
                .get(`/projects/${project.id}`)
                .set(auth(outsider.token))

            expect(res.status).toBe(403)
            expect(res.body.error.code).toBe('FORBIDDEN')
        })
    })

    describe('POST /projects/:id/members', () => {
        it('lets the owner add a member, who can then view the project', async () => {
            const project = await createProject(owner.token)

            const add = await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send({ email: 'member@mail.com' })

            expect(add.status).toBe(201)

            const view = await request(app)
                .get(`/projects/${project.id}`)
                .set(auth(member.token))

            expect(view.status).toBe(200)
        })

        it('rejects adding the same member twice', async () => {
            const project = await createProject(owner.token)
            const body = { email: 'member@mail.com' }

            await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send(body)

            const again = await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send(body)

            expect(again.status).toBe(409)
            expect(again.body.error.code).toBe('ALREADY_MEMBER')
        })

        it('rejects an email that is not registered', async () => {
            const project = await createProject(owner.token)

            const res = await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send({ email: 'nobody@mail.com' })

            expect(res.status).toBe(404)
            expect(res.body.error.code).toBe('USER_NOT_FOUND')
        })

        it('forbids a non-owner member from adding members', async () => {
            const project = await createProject(owner.token)

            await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send({ email: 'member@mail.com' })

            const res = await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(member.token))
                .send({ email: 'outsider@mail.com' })

            expect(res.status).toBe(403)
            expect(res.body.error.code).toBe('FORBIDDEN')
        })
    })

    describe('DELETE /projects/:id', () => {
        it('forbids a non-owner from deleting the project', async () => {
            const project = await createProject(owner.token)

            await request(app)
                .post(`/projects/${project.id}/members`)
                .set(auth(owner.token))
                .send({ email: 'member@mail.com' })

            const res = await request(app)
                .delete(`/projects/${project.id}`)
                .set(auth(member.token))

            expect(res.status).toBe(403)
        })

        it('lets the owner delete the project', async () => {
            const project = await createProject(owner.token)

            const del = await request(app)
                .delete(`/projects/${project.id}`)
                .set(auth(owner.token))

            expect(del.status).toBe(204)

            const after = await request(app)
                .get(`/projects/${project.id}`)
                .set(auth(owner.token))

            expect(after.status).toBe(404)
        })
    })
})