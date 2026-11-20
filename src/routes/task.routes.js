const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth')
const taskService = require('../services/task.service')

router.use(authMiddleware)

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T.*)?$/

function validationError(res, message) {
    return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message }
    })
}

router.patch('/:id', (req, res) => {
    const taskId = Number(req.params.id)

    if (!Number.isInteger(taskId) || taskId <= 0) {
        return validationError(res, 'Task id must be a positive number')
    }

    const { title, description, priority, status, dueDate, assigneeId } = req.body || {}

    const nothingSent = [title, description, priority, status, dueDate, assigneeId]
        .every((value) => value === undefined)

    if (nothingSent) {
        return validationError(res, 'At least one field is required to update')
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return validationError(res, 'Title cannot be blank')
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
        return validationError(res, 'Description must be a string or null')
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
        return validationError(res, 'Priority must be LOW, MEDIUM or HIGH')
    }

    if (status !== undefined && !STATUSES.includes(status)) {
        return validationError(res, 'Status must be TODO, IN_PROGRESS or DONE')
    }

    if (dueDate !== undefined && dueDate !== null) {
        if (typeof dueDate !== 'string' || !ISO_DATE_REGEX.test(dueDate) || Number.isNaN(Date.parse(dueDate))) {
            return validationError(res, 'Due date must be a valid ISO-8601 date')
        }
    }

    if (assigneeId !== undefined && assigneeId !== null) {
        if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
            return validationError(res, 'Assignee id must be a positive number or null')
        }
    }

    const result = taskService.updateTask(taskId, req.user.id, {
        title: title?.trim(),
        description,
        priority,
        status,
        dueDate,
        assigneeId
    })

    if (result.error === 'NOT_FOUND') {
        return res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Task not found' }
        })
    }

    if (result.error === 'FORBIDDEN') {
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'You are not a member of this project' }
        })
    }

    if (result.error === 'INVALID_ASSIGNEE') {
        return res.status(400).json({
            error: { code: 'INVALID_ASSIGNEE', message: 'Assignee must be a member of this project' }
        })
    }

    return res.status(200).json({ task: result.task })
})

module.exports = router