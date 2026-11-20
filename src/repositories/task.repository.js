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

const deleteTaskStmt = db.prepare('DELETE FROM tasks WHERE id = ?')

function deleteTask(id) {
    deleteTaskStmt.run(id)
}


const SORT_COLUMNS = {
    createdAt: 'created_at',
    dueDate: 'due_date'
}

function listTasks(projectId, options) {
    const conditions = ['project_id = ?']
    const params = [projectId]

    if (options.status !== undefined) {
        conditions.push('status = ?')
        params.push(options.status)
    }

    if (options.priority !== undefined) {
        conditions.push('priority = ?')
        params.push(options.priority)
    }

    if (options.assigneeId !== undefined) {
        conditions.push('assignee_id = ?')
        params.push(options.assigneeId)
    }

    if (options.dueFrom !== undefined) {
        conditions.push('due_date >= ?')
        params.push(options.dueFrom)
    }

    if (options.dueTo !== undefined) {
        conditions.push('due_date <= ?')
        params.push(options.dueTo)
    }

    const where = conditions.join(' AND ')

    const sortColumn = Object.hasOwn(SORT_COLUMNS, options.sortBy)
        ? SORT_COLUMNS[options.sortBy]
        : 'created_at'
    const direction = options.order === 'asc' ? 'ASC' : 'DESC'

    const total = db
        .prepare(`SELECT COUNT(*) AS total FROM tasks WHERE ${where}`)
        .get(...params).total

    const rows = db
        .prepare(
            `SELECT * FROM tasks WHERE ${where}
             ORDER BY ${sortColumn} ${direction}, id ${direction}
             LIMIT ? OFFSET ?`
        )
        .all(...params, options.limit, options.offset)

    return { rows, total }
}

const countByStatusStmt = db.prepare(
    'SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = ? GROUP BY status'
)

const countByPriorityStmt = db.prepare(
    'SELECT priority, COUNT(*) AS count FROM tasks WHERE project_id = ? GROUP BY priority'
)

function getTaskCounts(projectId) {
    return {
        byStatus: countByStatusStmt.all(projectId),
        byPriority: countByPriorityStmt.all(projectId)
    }
}


module.exports = { createTask, findTaskById , updateTask, deleteTask, listTasks, getTaskCounts}


