const projectRepo = require('../repositories/project.repository')

const createProject = (name,description,ownerId) => {
    const id = projectRepo.createProject(name,description,ownerId)

    return{
        id: Number(id),
        name,
        description:description || null,
        ownerId
    }
}

const listProjects = (userId) => {
    const rows = projectRepo.listProjectsForUser(userId)

    return rows.map((row) => ({
        id : row.id,
        name: row.name,
        description: row.description,
        ownerId: row.owner_id,
        createdAt: row.created_at
    }))
}


const getProject = (projectId, userId) => {
    const row = projectRepo.findProjectById(projectId)

    if (!row) {
        return { error: 'NOT_FOUND' }
    }

    if (!projectRepo.isMember(projectId, userId)) {
        return { error: 'FORBIDDEN' }
    }

    return {
        project: {
            id: row.id,
            name: row.name,
            description: row.description,
            ownerId: row.owner_id,
            createdAt: row.created_at
        }
    }
}


function deleteProject(projectId,userId){
    const project = projectRepo.findProjectById(projectId)

    if(!project){
        return {error : 'NOT_FOUND'}
    }

    if(project.owner_id !== userId){
        return {error : 'FORBIDDEN'}
    }

    projectRepo.deleteProject(projectId)
        return {success : true}

}

module.exports = { createProject,listProjects , getProject,deleteProject }