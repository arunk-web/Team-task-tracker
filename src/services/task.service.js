const taskRepo = require('../repositories/task.repository')
const projectRepo = require('../repositories/project.repository')



function formatTask(row) {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        dueDate: row.due_date,
        assigneeId: row.assignee_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
    }
}



function createTask(projectId, userId, data) {
    const project = projectRepo.findProjectById(projectId)
    if (!project) {
        return { error: 'NOT_FOUND' }
    }

    if (!projectRepo.isMember(projectId, userId)) {
        return { error: 'FORBIDDEN' }
    }

    const hasAssignee = data.assigneeId !== undefined && data.assigneeId !== null
    if (hasAssignee && !projectRepo.isMember(projectId, data.assigneeId)) {
        return { error: 'INVALID_ASSIGNEE' }
    }

    const id = taskRepo.createTask({
        projectId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        createdBy: userId
    })

    const row = taskRepo.findTaskById(id)

    return { task: formatTask(row) }
}

function updateTask(taskId,userId,changes){
    const task = projectRepo.isMember(task.project_id,userId)

    if(!task){
        return {error : 'NOT_FOUND'}
    }

    if(!projectRepo.isMember(task.project_id, userId)){
        return {error: 'FORBIDDEN'}
    }

    const hasAssignee = changes.assigneeId !== undefined && changes.assigneeId !== null
    if(hasAssignee && !projectRepo.isMember(task.project_id,changes.assigneeId)) {
        return {error : 'INVALID_ASSIGNEE'}
    }

    const fields = {}

    if(changes.title !== undefined) fields.title = changes.title
    if(changes.description !== undefined) fields.description = changes.description
    if(changes.priority !== undefined) fields.priority = changes.priority
    if(changes.dueDate !== undefined) fields.due_date = changes.dueDate
    if(changes.assigneeId !== undefined) fields.assignee_id = changes.assigneeId

    if (changes.status !== undefined) {
        fields.status = changes.status

        if (changes.status === 'DONE' && task.status !== 'DONE') {
            fields.completed_at = new Date().toISOString()
        } else if (changes.status !== 'DONE' && task.status === 'DONE') {
            fields.completed_at = null
        }
    }

    taskRepo.updateTask(taskId, fields)

    const row = taskRepo.findTaskById(taskId)

    return { task: formatTask(row) }

}

module.exports = { createTask , updateTask}