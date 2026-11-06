const db = require('../../db')

const insertProject = db.prepare(
    'INSERT INTO projects(name,description,owner_id) VALUES(?,?,?)'
)


const insertMember = db.prepare(
    'INSERT INTO projects_members (project_id,user_id) VALUES(?,?)'
)


const createProjectWithOwner = db.transaction((name,description,ownerId) => {
    const result = insertProject.run(name,description,ownerId)
    const projectId  = result.lastInsertRowid

    insertMember.run(projectId ,ownerId)

    return projectId
})


function createProject(name,description,ownerId ){
    return createProjectWithOwner(name,description || null, ownerId)
}

const listProjectsStmt = db.prepare(`
    SELECT p.*
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC, p.id DESC
`)

function listProjectsForUser(userId) {
    return listProjectsStmt.all(userId)
}

const findProjectStmt = db.prepare('SELECT * FROM projects WHERE id = ?')

const isMemberStmt = db.prepare(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
)

function findProjectById(id){
    return findProjectStmt.get(id)
}

function isMember(projectId, userId){
    return isMemberStmt.get(projectId,userId) !== undefined
}

const deleteProjectStmt = db.prepare('DELETE FROM projects WHERE id = ?')

function deleteProject(id){
    deleteProjectStmt.run(id)
}

const addMemberStmt = db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)')
function addMember(projectId,userId){
    addMemberStmt.run(projectId,userId)
}

module.exports = {createProject, listProjectsForUser, findProjectById, isMember,deleteProject,addMember}

