/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Persistence Layer - Handles the file operations
 */

const mongodb = require('mongodb')
const crypto = require('crypto')

let client = undefined

/**
 * Reads the database from the given cluster.
 * 
 * @async
 * @function readEmployeeData
 * @returns {Promise<Array<Object>>} Provides the connection to the database.
 */
async function readEmployeeData() {
    if (client) {
        return
    }
    client = new mongodb.MongoClient('mongodb+srv://Yyan:infs3201@cluster0.zavk84u.mongodb.net/')
    await client.connect()
}

/**
 * Returns all employees from the database.
 * 
 * @async
 * @returns {Promise<Array<Object>>} Array of all employee documents.
 */
async function allEmployees() {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let employees = db.collection('employees')
    let result = await employees.find().toArray()
    for (let i = 0; i < result.length; i++) {
        result[i]._id = result[i]._id.toString()
    }
    return result
}
 
/**
 * Returns a single employee matching the given ObjectId string.
 * 
 * @async
 * @param {string} id The 24-character hex ObjectId string of the employee.
 * @returns {Promise<Object|null>} The matching employee document, or null.
 */
async function getOneEmployee(id) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let employees = db.collection('employees')
    let empObjectId = new mongodb.ObjectId(id)
    let result = await employees.findOne({ _id: empObjectId })
    if (result) {
        result._id = result._id.toString()
    }
    return result
}
 
/**
 * Returns all shifts assigned to the given employee ObjectId.
 * Queries the shifts collection for documents whose "employees" array
 * contains the given ObjectId.
 * 
 * @async
 * @param {string} employeeId The 24-character hex ObjectId string of the employee.
 * @returns {Promise<Array<Object>|undefined>} Array of shift documents, or undefined if none.
 */
async function empSchedule(employeeId) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let shifts = db.collection('shifts')
    let empObjectId = new mongodb.ObjectId(employeeId)
    let result = await shifts.find({ employees: empObjectId }).toArray()
 
    if (result.length === 0) {
        return undefined
    }
    return result
}
 
/**
 * Updates the name and phone of an employee identified by ObjectId.
 * 
 * @async
 * @param {string} empId The 24-character hex ObjectId string of the employee.
 * @param {string} empName The new name for the employee.
 * @param {string} empNum The new phone number for the employee.
 * @returns {Promise<void>}
 */
async function editEmployee(empId, empName, empNum) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let employees = db.collection('employees')
    let empObjectId = new mongodb.ObjectId(empId)
    await employees.updateOne(
        { _id: empObjectId },
        { $set: { name: empName, phone: empNum } }
    )
}

/**
 * Creates a new session document in the sessions collection.
 * 
 * @param {*} token 
 * @param {*} username 
 * @param {*} expiry 
 */
async function createSession(token, username, expiresAt) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let sessions = db.collection('sessions')
    await sessions.insertOne({ token: token, username: username, expiresAt: new Date(expiresAt) })
}

/**
 * Retrieves a session document by its token.
 * 
 * @param {*} token 
 * @returns 
 */
async function getSession(token) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let sessions = db.collection('sessions')
    return sessions.findOne({ token: token })
}

/**
 * Updates the expiration time of a session document.
 * 
 * @param {*} token 
 * @param {*} expiry
 */
async function updateSession(token, expiresAt) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let sessions = db.collection('sessions')
    await sessions.updateOne({ token: token }, { $set: { expiresAt: new Date(expiresAt) } })
}

/**
 * Removes the session document.
 * 
 * @param {*} token 
 */
async function deleteSession(token) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let sessions = db.collection('sessions')
    await sessions.deleteOne({ token: token })
}

/**
 * Looks up a user by username and SHA-256 hashed password.
 * 
 * @async
 * @param {string} username The submitted username.
 * @param {string} password The submitted plaintext password (will be hashed here).
 * @returns {Promise<Object|null>} The matching user document, or null if not found.
 */
async function loginUser(username, password) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let users = db.collection('users')
    let hashed = crypto.createHash('sha256').update(password).digest('hex')
    return users.findOne({ username: username, password: hashed })
}
 
/**
 * Inserts a security log entry into the security_log collection.
 * 
 * @async
 * @param {Object} entry The log entry object.
 * @param {Date}   entry.timestamp   When the request occurred.
 * @param {string|null} entry.username  The logged-in username, or null.
 * @param {string} entry.url         The URL that was accessed.
 * @param {string} entry.method      The HTTP method (GET, POST, etc.).
 * @returns {Promise<void>}
 */
async function logAccess(username, url, method) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let log = db.collection('security_logs')
    await log.insertOne({
        timestamp: new Date(),
        username: username,
        url: url,
        method: method,
    })
}

//=====================================================================
// New functions specific for assignment 5
//=====================================================================

async function getUserByUsername(username) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let users = db.collection('users')

    let user = await users.findOne({ username: username })

    if (!user) {
        return null
    }

    if (typeof user.failedLoginAttempts !== 'number') {
        user.failedLoginAttempts = 0
    }

    if (typeof user.locked !== 'boolean') {
        user.locked = false
    }

    return user
}

async function incrementFailedLoginAttempts(username) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let users = db.collection('users')

    let user = await users.findOne({ username: username })
    let attempts = 0

    if (user && typeof user.failedLoginAttempts === 'number') {
        attempts = user.failedLoginAttempts
    }

    attempts++

    await users.updateOne(
        { username: username },
        { $set: { failedLoginAttempts: attempts } }
    )

    return attempts
}

async function resetFailedLoginAttempts(username) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let users = db.collection('users')

    await users.updateOne(
        { username: username },
        { $set: { failedLoginAttempts: 0 } }
    )
}

async function lockUserAccount(username) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let users = db.collection('users')

    await users.updateOne(
        { username: username },
        { $set: { locked: true } }
    )
}

async function createPendingLogin(pendingToken, username, code, expiresAt) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let pendingLogins = db.collection('pending_logins')

    await pendingLogins.deleteMany({ username: username })

    await pendingLogins.insertOne({
        pendingToken: pendingToken,
        username: username,
        code: code,
        expiresAt: new Date(expiresAt),
    })
}

async function getPendingLogin(pendingToken) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let pendingLogins = db.collection('pending_logins')

    return await pendingLogins.findOne({ pendingToken: pendingToken })
}

async function deletePendingLogin(pendingToken) {
    await readEmployeeData()
    let db = client.db('infs_3203')
    let pendingLogins = db.collection('pending_logins')

    await pendingLogins.deleteOne({ pendingToken: pendingToken })
}


/**
 * Adds a new document for a given employee ID.
 * 
 * @param {*} empId 
 * @param {*} doc 
 */
async function addEmployeeDocument(empId, doc) {
    await readEmployeeData()

    let db = client.db('infs_3203')
    let employees = db.collection('employees')

    await employees.updateOne(
        { _id: new mongodb.ObjectId(empId) },
        {
            $push: {
                documents: {
                    _id: new mongodb.ObjectId(),
                    originalName: doc.originalName,
                    storedName: doc.storedName,
                    mimeType: doc.mimeType,
                    size: doc.size,
                    uploadedAt: doc.uploadedAt,
                }
            }
        }
    )
}

/**
 * Returns all documents for a given employee ID.
 * 
 * @param {*} empId 
 * @returns 
 */
async function getEmployeeDocuments(empId) {
    await readEmployeeData()

    let db = client.db('infs_3203')
    let employees = db.collection('employees')
    let employee = await employees.findOne({ _id: new mongodb.ObjectId(empId) })

    if (!employee || !employee.documents) {
        return []
    }

    let i = 0
    for (i = 0; i < employee.documents.length; i++) {
        employee.documents[i]._id = employee.documents[i]._id.toString()
    }

    return employee.documents
}

/**
 * Returns a specific document for a given employee ID and document ID.
 * 
 * @param {*} empId 
 * @param {*} docId 
 * @returns 
 */
async function getEmployeeDocument(empId, docId) {
    await readEmployeeData()

    let db = client.db('infs_3203')
    let employees = db.collection('employees')
    let employee = await employees.findOne({ _id: new mongodb.ObjectId(empId) })

    if (!employee || !employee.documents) {
        return null
    }

    let i = 0
    for (i = 0; i < employee.documents.length; i++) {
        if (employee.documents[i]._id.toString() === docId) {
            employee.documents[i]._id = employee.documents[i]._id.toString()
            return employee.documents[i]
        }
    }

    return null
}
 
module.exports = {
    readEmployeeData,
    allEmployees,
    getOneEmployee,
    editEmployee,
    empSchedule,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    loginUser,
    logAccess,
    getUserByUsername,
    incrementFailedLoginAttempts,
    resetFailedLoginAttempts,
    lockUserAccount,
    createPendingLogin,
    getPendingLogin,
    deletePendingLogin,
    addEmployeeDocument,
    getEmployeeDocuments,
    getEmployeeDocument,
}