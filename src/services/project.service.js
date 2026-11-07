const projectRepo = require('../repositories/project.repository')
const {findByEmail} = require('../repositories/user.repository')

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

function addMember(projectId,requesterId,email){
    const project = projectRepo.findProjectById(projectId)
    if(!project){
        return {error: 'NOT_FOUND'}
    }

    if(project.owner_id !== requesterId){
        return {error : 'FORBIDDEN'}
    }

    const user = findByEmail(email)
    if(!user){
        return {error : 'USER_NOT_FOUND'}
    }

    if(projectRepo.isMember(projectId,user.id)){
        return {error : 'ALREADY_MEMBER'}
    }

    projectRepo.addMember(projectId,user.id)
    
    return {member: {id:user.id , name: user.name ,email:user.email } }
}

module.exports = { createProject,listProjects , getProject,deleteProject,addMember }