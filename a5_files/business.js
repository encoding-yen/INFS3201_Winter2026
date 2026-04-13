/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Business Layer - Handles the business operations
 */

const perst = require('./persistence')

/**
 * Returns all employees.
 * 
 * @async
 * @returns {Promise<Array<Object>>} Array of all employee documents.
 */
async function allEmployees() {
    return await perst.allEmployees()
}
 
/**
 * Returns a single employee by ObjectId string.
 * 
 * @async
 * @param {string} id The 24-character hex ObjectId string.
 * @returns {Promise<Object|null>} The matching employee, or null.
 */
async function getOneEmployee(id) {
    return await perst.getOneEmployee(id)
}
 
/**
 * Returns the shift schedule for the given employee ObjectId string.
 * 
 * @async
 * @param {string} employee The 24-character hex ObjectId string of the employee.
 * @returns {Promise<Array<Object>|undefined>} Array of shifts, or undefined if none.
 */
async function empSchedule(employee) {
    return await perst.empSchedule(employee)
}
 
/**
 * Updates the name and phone of an existing employee.
 * 
 * @async
 * @param {string} empId The 24-character hex ObjectId string of the employee.
 * @param {string} empName The new name.
 * @param {string} empNum The new phone number.
 * @returns {Promise<void>}
 */
async function editEmployee(empId, empName, empNum) {
    return await perst.editEmployee(empId, empName, empNum)
}
 
/**
 * Authenticates a user by username and password.
 * 
 * @async
 * @param {string} username The submitted username.
 * @param {string} password The submitted plaintext password.
 * @returns {Promise<Object|null>} The matching user document, or null if invalid.
 */
async function authenticateUser(username, password) {
    return await perst.loginUser(username, password)
}

/**
 * Creates a new session for the given token, username, and expiration time.
 * 
 * @param {*} token 
 * @param {*} username 
 * @param {*} expiresAt 
 * @returns {Promise<Object>}
 */
async function createSession(token, username, expiry) {
    return await perst.createSession(token, username, expiry)
}

/**
 * Retrieves a session document by its token.
 * 
 * @param {*} token 
 * @returns {Promise<Object>}
 */
async function getSession(token) {
    return await perst.getSession(token)
}

/**
 * Updates the expiry time of a session identified by its token.
 * 
 * @param {*} token 
 * @param {*} expiry 
 * @returns {Promise<Object>}
 */
async function updateSession(token, expiry) {
    return await perst.updateSession(token, expiry)
}

/**
 * Deletes a session document by its token.
 * 
 * @param {*} token 
 * @returns {Promise<Object>} 
 */
async function deleteSession(token) {
    return await perst.deleteSession(token)
}

/**
 * Records an access event to the security log.
 * 
 * @async
 * @param {string|null} username The logged-in username, or null if unauthenticated.
 * @param {string} url The URL accessed.
 * @param {string} method The HTTP method used.
 * @returns {Promise<void>}
 */
async function logAccess(username, url, method) {
    return await perst.logAccess( username, url, method )
}

module.exports = {
    allEmployees,
    getOneEmployee,
    empSchedule,
    editEmployee,
    authenticateUser,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    logAccess,
}