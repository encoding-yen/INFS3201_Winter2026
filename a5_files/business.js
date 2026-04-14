/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Business Layer - Handles the business operations
 */

const perst = require('./persistence')
const emailer = require('./emailSystem') // New file to handle email sending logic
const crypto = require('crypto')

// Generate the session and 2fa durations on ms
const SESSION_DURATION_MS = 5 * 60 * 1000
const TWO_FACTOR_DURATION_MS = 3 * 60 * 1000

// Formats the document max size and limit per employee
const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024
const MAX_DOCUMENTS_PER_EMPLOYEE = 5

// Moved token generation to business layer.
function generateToken() {
    return crypto.randomBytes(32).toString('hex')
}

// Generate the random 6-digit 2FA code as a string
function generateTwoFactorCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper function to get the user email.
function getUserEmail(user) {
    if (user && user.email) {
        return user.email
    }

    if (user && user.username) {
        return user.username + '@example.com'
    }

    return 'unknown@example.com'
}


/**
 * Begins the login process for a user.
 * 
 * @async
 * @param {string} username The username of the user.
 * @param {string} password The password of the user.
 * @returns {Promise<Object>} The login result.
 */
async function beginLogin(username, password) {
    let user = await perst.getUserByUsername(username)

    if (!user) {
        return {
            success: false,
            message: 'Invalid username or password.',
        }
    }

    if (user.locked === true) {
        return {
            success: false,
            message: 'This account is locked.',
        }
    }

    let validLogin = await perst.loginUser(username, password)

    if (!validLogin) {
        let attempts = await perst.incrementFailedLoginAttempts(username)

        if (attempts >= 3 && attempts < 10) {
            await sendSuspiciousActivityEmail(user, attempts)
        }

        if (attempts >= 10) {
            await perst.lockUserAccount(username)
            await sendAccountLockedEmail(user)

            return {
                success: false,
                message: 'This account has been locked due to too many invalid login attempts.',
            }
        }

        return {
            success: false,
            message: 'Invalid username or password.',
        }
    }

    await perst.resetFailedLoginAttempts(username)

    let code = generateTwoFactorCode()
    let pendingToken = generateToken()
    let expiresAt = Date.now() + TWO_FACTOR_DURATION_MS

    await perst.createPendingLogin(pendingToken, username, code, expiresAt)
    await sendTwoFactorCodeEmail(user, code)

    return {
        success: true,
        pendingToken: pendingToken,
        message: 'A 2FA code has been sent to your email.',
    }
}

/**
 * Verifies the 2FA login request.
 * 
 * @async
 * @param {string} pendingToken The pending login token.
 * @param {string} code The 2FA code.
 * @returns {Promise<Object>} The verification result.
 */
async function verifyTwoFactorLogin(pendingToken, code) {
    let pendingLogin = await perst.getPendingLogin(pendingToken)

    if (!pendingLogin) {
        return {
            success: false,
            message: 'The 2FA request is invalid or has expired.',
        }
    }

    if (pendingLogin.expiresAt.getTime() <= Date.now()) {
        await perst.deletePendingLogin(pendingToken)

        return {
            success: false,
            message: 'The 2FA code has expired. Please log in again.',
        }
    }

    if (pendingLogin.code !== code) {
        return {
            success: false,
            message: 'Invalid 2FA code.',
        }
    }

    let sessionToken = generateToken()
    let expiry = Date.now() + SESSION_DURATION_MS

    await perst.createSession(sessionToken, pendingLogin.username, expiry)
    await perst.deletePendingLogin(pendingToken)

    return {
        success: true,
        sessionToken: sessionToken,
        expiresAt: expiry,
    }
}

/**
 *  Sends a 2FA code email to the user.
 * 
 * @param {*} user 
 * @param {*} code 
 */
async function sendTwoFactorCodeEmail(user, code) {
    let email = getUserEmail(user)
    let message = 'Your 2FA code is ' + code + '. It expires in 3 minutes.'
    await emailer.sendEmail(email, 'Your 2FA Code', message)
}

/**
 * Sends a suspicious activity email after 3 failed login attempts.
 * 
 * @param {*} user 
 * @param {*} attempts 
 */
async function sendSuspiciousActivityEmail(user, attempts) {
    let email = getUserEmail(user)
    let message = 'There have been ' + attempts + ' invalid login attempts on your account.'
    await emailer.sendEmail(email, 'Suspicious Activity Detected', message)
}

/**
 * Sends an error message after 10 login attempts.
 * 
 * @param {*} user 
 */
async function sendAccountLockedEmail(user) {
    let email = getUserEmail(user)
    let message = 'Your account has been locked after 10 invalid login attempts.'
    await emailer.sendEmail(email, 'Account Locked', message)
}

/**
 * Validates the uploaded document, returns an error message.
 * 
 * @param {*} empId 
 * @param {*} file 
 * @returns 
 */
async function validateEmployeeDocumentUpload(empId, file) {
    if (!file) {
        return {
            success: false,
            message: 'Please choose a PDF document to upload.',
        }
    }

    if (file.mimetype !== 'application/pdf') {
        return {
            success: false,
            message: 'Only PDF documents are allowed.',
        }
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
        return {
            success: false,
            message: 'File must be 2MB or less.',
        }
    }

    let docs = await perst.getEmployeeDocuments(empId)
    if (docs.length >= MAX_DOCUMENTS_PER_EMPLOYEE) {
        return {
            success: false,
            message: 'No more than 5 documents are permitted for any employee.',
        }
    }

    return {
        success: true,
        message: null,
    }
}

// Creates the safename for the uploaded document
function createSafeDocumentName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Saves metadata for a new employee document.
 * 
 * @param {*} empId 
 * @param {*} docData 
 */
async function saveEmployeeDocumentMetadata(empId, docData) {
    await perst.addEmployeeDocument(empId, {
        originalName: docData.originalName,
        storedName: docData.storedName,
        mimeType: docData.mimeType,
        size: docData.size,
        uploadedAt: new Date(),
    })
}

/**
 * Returns all documents for a given employee ID.
 * 
 * @param {*} empId 
 * @returns 
 */
async function getEmployeeDocuments(empId) {
    return await perst.getEmployeeDocuments(empId)
}

/**
 * Returns a specific document for a given employee ID and document ID.
 * 
 * @param {*} empId 
 * @param {*} docId 
 * @returns 
 */
async function getEmployeeDocument(empId, docId) {
    return await perst.getEmployeeDocument(empId, docId)
}

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
    SESSION_DURATION_MS,
    TWO_FACTOR_DURATION_MS,
    allEmployees,
    getOneEmployee,
    empSchedule,
    editEmployee,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    logAccess,
    beginLogin,
    verifyTwoFactorLogin,
    validateEmployeeDocumentUpload,
    createSafeDocumentName,
    saveEmployeeDocumentMetadata,
    getEmployeeDocuments,
    getEmployeeDocument,
}