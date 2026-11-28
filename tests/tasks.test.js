const request = require('supertest')
const app = require('../src/app')
const { createUserAndLogin, createProject, addMember, createTask } = require('./helpers')

const auth = (token) => ({ Authorization: `Bearer ${token}` })

describe('Tasks', () => {
    let owner
    let member
    let member2
    let outsider

    beforeAll(async () => {
        owner = await createUserAndLogin('Owner', 'owner@mail.com')
        member = await createUserAndLogin('Member', 'member@mail.com')
        member2 = await createUserAndLogin('Member Two', 'member2@mail.com')
        outsider = await createUserAndLogin('Outsider', 'outsider@mail.com')
    })

    describe('POST /projects/:id/tasks', () => {
        let project

        beforeAll(async () => {
            project = await createProject(owner.token)
            await addMember(owner.token, project.id, 'member@mail.com')
        })

        const create = (token, body) =>
            request(app).post(`/projects/${project.id}/tasks`).set(auth(token)).send(body)

        it('creates a task with TODO status and no completedAt', async () => {
            const res = await create(owner.token, { title: '  Fix bug  ', priority: 'HIGH' })

            expect(res.status).toBe(201)
            expect(res.body.task.title).toBe('Fix bug')
            expect(res.body.task.status).toBe('TODO')
            expect(res.body.task.completedAt).toBeNull()
            expect(res.body.task.createdBy).toBe(owner.user.id)
        })

        it('rejects an assignee who is not a project member', async () => {
            const res = await create(owner.token, {
                title: 'Task',
                priority: 'LOW',
                assigneeId: outsider.user.id
            })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe('INVALID_ASSIGNEE')
        })

        it('accepts an assignee who is a project member', async () => {
            const res = await create(owner.token, {
                title: 'Task',
                priority: 'LOW',
                assigneeId: member.user.id
            })

            expect(res.status).toBe(201)
            expect(res.body.task.assigneeId).toBe(member.user.id)
        })

        it('forbids a non-member from creating a task', async () => {
            const res = await create(outsider.token, { title: 'Task', priority: 'LOW' })

            expect(res.status).toBe(403)
        })

        it('rejects an invalid priority', async () => {
            const res = await create(owner.token, { title: 'Task', priority: 'BANANA' })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe('VALIDATION_ERROR')
        })

        it('rejects a blank title', async () => {
            const res = await create(owner.token, { title: '   ', priority: 'LOW' })

            expect(res.status).toBe(400)
        })
    })

    describe('PATCH /tasks/:id', () => {
        let project

        beforeAll(async () => {
            project = await createProject(owner.token)
            await addMember(owner.token, project.id, 'member@mail.com')
        })

        const patch = (token, taskId, body) =>
            request(app).patch(`/tasks/${taskId}`).set(auth(token)).send(body)

        it('sets completedAt when status first becomes DONE', async () => {
            const task = await createTask(owner.token, project.id)

            const res = await patch(owner.token, task.id, { status: 'DONE' })

            expect(res.status).toBe(200)
            expect(res.body.task.status).toBe('DONE')
            expect(res.body.task.completedAt).toBeTruthy()
        })

        it('keeps the original completedAt when DONE is sent again', async () => {
            const task = await createTask(owner.token, project.id)

            const first = await patch(owner.token, task.id, { status: 'DONE' })
            const second = await patch(owner.token, task.id, { status: 'DONE' })

            expect(second.body.task.completedAt).toBe(first.body.task.completedAt)
        })

        it('clears completedAt when the task is reopened', async () => {
            const task = await createTask(owner.token, project.id)

            await patch(owner.token, task.id, { status: 'DONE' })
            const res = await patch(owner.token, task.id, { status: 'IN_PROGRESS' })

            expect(res.status).toBe(200)
            expect(res.body.task.status).toBe('IN_PROGRESS')
            expect(res.body.task.completedAt).toBeNull()
        })

        it('rejects a non-member assignee on update', async () => {
            const task = await createTask(owner.token, project.id)

            const res = await patch(owner.token, task.id, { assigneeId: outsider.user.id })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe('INVALID_ASSIGNEE')
        })

        it('rejects an empty update body', async () => {
            const task = await createTask(owner.token, project.id)

            const res = await patch(owner.token, task.id, {})

            expect(res.status).toBe(400)
        })

        it('forbids a non-member from updating a task', async () => {
            const task = await createTask(owner.token, project.id)

            const res = await patch(outsider.token, task.id, { title: 'Hacked' })

            expect(res.status).toBe(403)
        })
    })

    describe('DELETE /tasks/:id', () => {
        let project

        beforeAll(async () => {
            project = await createProject(owner.token)
            await addMember(owner.token, project.id, 'member@mail.com')
            await addMember(owner.token, project.id, 'member2@mail.com')
        })

        const remove = (token, taskId) =>
            request(app).delete(`/tasks/${taskId}`).set(auth(token))

        it('lets the task creator delete their own task', async () => {
            const task = await createTask(member.token, project.id)

            const res = await remove(member.token, task.id)

            expect(res.status).toBe(204)
        })

        it('forbids a member who is neither owner nor creator', async () => {
            const task = await createTask(member.token, project.id)

            const res = await remove(member2.token, task.id)

            expect(res.status).toBe(403)
        })

        it('lets the project owner delete any task', async () => {
            const task = await createTask(member.token, project.id)

            const res = await remove(owner.token, task.id)

            expect(res.status).toBe(204)
        })
    })

    describe('GET /projects/:id/tasks (filters, sorting, pagination)', () => {
        let project

        const list = (token, query = '') =>
            request(app).get(`/projects/${project.id}/tasks${query}`).set(auth(token))

        const titles = (res) => res.body.tasks.map((t) => t.title)

        beforeAll(async () => {
            project = await createProject(owner.token)
            await addMember(owner.token, project.id, 'member@mail.com')

            await createTask(owner.token, project.id, {
                title: 'T1',
                priority: 'LOW',
                dueDate: '2026-12-01',
                assigneeId: member.user.id
            })

            const t2 = await createTask(owner.token, project.id, {
                title: 'T2',
                priority: 'HIGH',
                dueDate: '2026-12-15'
            })
            await request(app)
                .patch(`/tasks/${t2.id}`)
                .set(auth(owner.token))
                .send({ status: 'IN_PROGRESS' })

            const t3 = await createTask(owner.token, project.id, {
                title: 'T3',
                priority: 'HIGH',
                dueDate: '2026-12-31'
            })
            await request(app)
                .patch(`/tasks/${t3.id}`)
                .set(auth(owner.token))
                .send({ status: 'DONE' })
        })

        it('filters by status', async () => {
            const res = await list(owner.token, '?status=DONE')

            expect(res.status).toBe(200)
            expect(titles(res)).toEqual(['T3'])
        })

        it('filters by priority', async () => {
            const res = await list(owner.token, '?priority=HIGH')

            expect(res.body.tasks).toHaveLength(2)
        })

        it('filters by assignee', async () => {
            const res = await list(owner.token, `?assigneeId=${member.user.id}`)

            expect(titles(res)).toEqual(['T1'])
        })

        it('combines status and priority filters', async () => {
            const res = await list(owner.token, '?status=IN_PROGRESS&priority=HIGH')

            expect(titles(res)).toEqual(['T2'])
        })

        it('filters by due date range', async () => {
            const res = await list(owner.token, '?dueFrom=2026-12-10&dueTo=2026-12-20')

            expect(titles(res)).toEqual(['T2'])
        })

        it('sorts by dueDate ascending', async () => {
            const res = await list(owner.token, '?sortBy=dueDate&order=asc')

            expect(titles(res)).toEqual(['T1', 'T2', 'T3'])
        })

        it('sorts by dueDate descending', async () => {
            const res = await list(owner.token, '?sortBy=dueDate&order=desc')

            expect(titles(res)).toEqual(['T3', 'T2', 'T1'])
        })

        it('paginates without repeating or losing tasks', async () => {
            const page1 = await list(owner.token, '?pageSize=2&page=1&sortBy=dueDate&order=asc')
            const page2 = await list(owner.token, '?pageSize=2&page=2&sortBy=dueDate&order=asc')

            expect(page1.body.pagination).toEqual({ page: 1, pageSize: 2, total: 3, totalPages: 2 })
            expect(titles(page1)).toEqual(['T1', 'T2'])
            expect(titles(page2)).toEqual(['T3'])
        })

        it('rejects a page size above 50', async () => {
            const res = await list(owner.token, '?pageSize=51')

            expect(res.status).toBe(400)
        })

        it('rejects an invalid status filter', async () => {
            const res = await list(owner.token, '?status=BANANA')

            expect(res.status).toBe(400)
        })

        it('forbids a non-member from listing tasks', async () => {
            const res = await list(outsider.token)

            expect(res.status).toBe(403)
        })
    })

    describe('GET /projects/:id/summary', () => {
        it('returns total and counts by status and priority', async () => {
            const project = await createProject(owner.token)

            await createTask(owner.token, project.id, { priority: 'LOW' })
            await createTask(owner.token, project.id, { priority: 'HIGH' })
            const done = await createTask(owner.token, project.id, { priority: 'HIGH' })
            await request(app)
                .patch(`/tasks/${done.id}`)
                .set(auth(owner.token))
                .send({ status: 'DONE' })

            const res = await request(app)
                .get(`/projects/${project.id}/summary`)
                .set(auth(owner.token))

            expect(res.status).toBe(200)
            expect(res.body.summary).toEqual({
                total: 3,
                byStatus: { TODO: 2, IN_PROGRESS: 0, DONE: 1 },
                byPriority: { LOW: 1, MEDIUM: 0, HIGH: 2 }
            })
        })

        it('returns zero counts for a project with no tasks', async () => {
            const project = await createProject(owner.token)

            const res = await request(app)
                .get(`/projects/${project.id}/summary`)
                .set(auth(owner.token))

            expect(res.body.summary.total).toBe(0)
            expect(res.body.summary.byStatus).toEqual({ TODO: 0, IN_PROGRESS: 0, DONE: 0 })
        })

        it('forbids a non-member from viewing the summary', async () => {
            const project = await createProject(owner.token)

            const res = await request(app)
                .get(`/projects/${project.id}/summary`)
                .set(auth(outsider.token))

            expect(res.status).toBe(403)
        })
    })
})