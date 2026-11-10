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

const UPDATABLE_COLUMNS = ['title','description','priority','status','due_date','assignee_id','completed_at']

function updateTask(id,fields){
    const keys = object.keys(fields).filter((key) => UPDATABLE_COLUMNS.includes(key))

    if(keys.length === 0){
        return
    }

    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const values = keys.map((key) => fields[key])

    db.prepare(
        `UPDATE tasks SET ${setClause},updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values,id)

}



module.exports = { createTask, findTaskById , updateTask}