const db = require('../../db')

const insertTaskStmt  = db.prepare(`
    INSERT INTO tasks (project_id,title,description,priority,due_date,assignee_id,created_by) VALUES (?,?,?,?,?,?,?)
    
`)

const findTaskStmt = db.prepare('SELECT * FROM tasks WHERE id = ?')

function createTask({ projectId, title, description, priority, dueDate, assigneeId, createdBy }) {
    const result = insertTaskStmt.run(
        projectId,
        title,
        description ?? null,
        priority,
        dueDate ?? null,
        assigneeId ?? null,
        createdBy
    )

    return Number(result.lastInsertRowid)
}

function findTaskById(id) {
    return findTaskStmt.get(id)
}

module.exports = { createTask, findTaskById }