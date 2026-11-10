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



module.exports = { createTask }