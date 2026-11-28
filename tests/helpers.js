const request = require('supertest')
const app = require('../src/app')

const auth = (token) => ({ Authorization: `Bearer ${token}` })

async function createUserAndLogin(name, email, password = '12345678') {
    await request(app).post('/auth/register').send({ name, email, password })

    const res = await request(app).post('/auth/login').send({ email, password })

    return { token: res.body.token, user: res.body.user }
}

async function createProject(token, name = 'Website') {
    const res = await request(app)
        .post('/projects')
        .set(auth(token))
        .send({ name })

    return res.body.project
}

async function addMember(ownerToken, projectId, email) {
    await request(app)
        .post(`/projects/${projectId}/members`)
        .set(auth(ownerToken))
        .send({ email })
}

async function createTask(token, projectId, data = {}) {
    const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set(auth(token))
        .send({ title: 'Task', priority: 'MEDIUM', ...data })

    return res.body.task
}

module.exports = { createUserAndLogin, createProject, addMember, createTask }