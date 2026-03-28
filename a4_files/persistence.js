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
    client = new mongodb.MongoClient('mongodb+srv://60306991_Yyan:infs3201@cluster0.xhwpjs2.mongodb.net/')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
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
    let db = client.db('infs3201_winter2026')
    let log = db.collection('security_logs')
    await log.insertOne({
        timestamp: new Date(),
        username: username,
        url: url,
        method: method,
    })
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
}