/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Presentation Layer - Handles the UI functionalities
 */

const bsn = require('./business')
const express = require('express')
const { engine } = require('express-handlebars')
const cookieParser = require('cookie-parser')
const app = express()

const fileUpload = require('express-fileupload')
const fs = require('fs')
const path = require('path')
app.use(cookieParser())

// Handlebars setup
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/templates',
}))
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/templates')

app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())

// Session duration: 300 seconds (5 minutes)
const duration = bsn.SESSION_DURATION_MS

// Token used to verify the user login attempts
function getPendingToken(req) {
    if (!req.cookies) {
        return null
    }

    if (!req.cookies.pendingLoginToken) {
        return null
    }

    return req.cookies.pendingLoginToken
}

/**
 * Reads the session token from the cookie header.
 * 
 * @param {express.Request} req The request from the client.
 * @returns {String|null} The session token, or null if not present.
 */
function getTokenFromCookie(req) {
    let cookieHeader = req.headers.cookie
    if (!cookieHeader) {
        return null
    }

    let token = null
    let parts = cookieHeader.split(';')
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim()
        if (part.startsWith('sessionToken=')) {
            token = part.slice('sessionToken='.length)
        }
    }
    return token
}

/**
 * Logs the user activity into the security_log collection.
 * 
 * @async
 * @param {express.Request} req The request from the client.
 * @param {express.Response} res The response from the server.
 * @param {Function} next The next middleware function.
 * @returns {Promise<void>}
 */
async function accessLogMiddleware(req, res, next) {
    let token = getTokenFromCookie(req)
    let username = null

    if (token) {
        let session = await bsn.getSession(token)
        if (session && session.expiresAt.getTime() > Date.now()) {
            username = session.username
        }
    }

    await bsn.logAccess(username, req.url, req.method)
    next()
}

app.use(accessLogMiddleware)

// Updated the authentication middleware to support 2FA and account lockout features
/**
 * Authenticates the user based on the session token cookie.
 * 
 * @async
 * @param {express.Request} req The request from the client.
 * @param {express.Response} res The response from the server.
 * @param {Function} next The next middleware function.
 * @returns {Promise<void>}
 */
async function authenticate(req, res, next) {
    if (req.path === '/login' || req.path === '/logout' || req.path === '/two-factor') {
        return next()
    }

    let token = getTokenFromCookie(req)

    if (!token) {
        return res.render('login', {
            title: 'Login',
            message: 'Please log in to continue.',
        })
    }

    let session = await bsn.getSession(token)

    if (!session) {
        return res.render('login', {
            title: 'Login',
            message: 'Please log in to continue.',
        })
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        await bsn.deleteSession(token)

        return res.render('login', {
            title: 'Login',
            message: 'Your session has expired. Please log in again.',
        })
    }

    await bsn.updateSession(token, Date.now() + duration)
    req.username = session.username
    next()
}

app.use(authenticate)

// Login and Logout routes
// Login Routes have been updated to support 2FA and account lockout features
app.get('/login', function (req, res) {
    res.clearCookie('pendingLoginToken')
    res.render('login', {
        title: 'Login',
        message: null,
    })
})

app.post('/login', async function (req, res) {
    let username = req.body.username.trim()
    let password = req.body.password

    let result = await bsn.beginLogin(username, password)

    if (!result.success) {
        return res.render('login', {
            title: 'Login',
            message: result.message,
        })
    }

    res.cookie('pendingLoginToken', result.pendingToken, {
        httpOnly: true,
        maxAge: bsn.TWO_FACTOR_DURATION_MS,
    })

    return res.render('two_factor', {
        title: 'Two Factor Authentication',
        message: result.message,
    })
})

app.get('/two-factor', function (req, res) {
    let pendingToken = getPendingToken(req)

    if (!pendingToken) {
        return res.redirect('/login')
    }

    res.render('two_factor', {
        title: 'Two Factor Authentication',
        message: null,
    })
})

app.post('/two-factor', async function (req, res) {
    let pendingToken = getPendingToken(req)
    let code = req.body.code.trim()

    if (!pendingToken) {
        return res.render('login', {
            title: 'Login',
            message: 'Please log in again.',
        })
    }

    let result = await bsn.verifyTwoFactorLogin(pendingToken, code)

    if (!result.success) {
        return res.render('two_factor', {
            title: 'Two Factor Authentication',
            message: result.message,
        })
    }

    res.clearCookie('pendingLoginToken')
    res.cookie('sessionToken', result.sessionToken, {
        httpOnly: true,
        maxAge: duration,
    })

    return res.redirect('/')
})

// Updated logout route to clear both session and pending login tokens, and to support account lockout notifications
app.get('/logout', async function (req, res) {
    let token = getTokenFromCookie(req)

    if (token) {
        await bsn.deleteSession(token)
    }

    res.clearCookie('sessionToken')
    res.clearCookie('pendingLoginToken')

    res.render('login', {
        title: 'Login',
        message: 'You have been logged out.',
    })
})
// ============================================================

// Protected application routes
app.get('/', async (req, res) => {
    let employees = await bsn.allEmployees()
    res.render('all_employees', {
        title: 'List of Employees',
        username: req.username,
        employees: employees,
    })
})

// Update employee route to include schedule and documents
app.get('/employee/:id', async function (req, res) {
    let empId = req.params.id
    let employee = await bsn.getOneEmployee(empId)
    let schedule = await bsn.empSchedule(empId)
    let documents = await bsn.getEmployeeDocuments(empId)

    res.render('employee_details', {
        title: 'Employee Details',
        username: req.username,
        employee: employee,
        schedule: schedule,
        hasSchedule: schedule !== undefined,
        documents: documents,
        hasDocuments: documents.length > 0,
        uploadError: null,
    })
})

// Employee document upload route
app.post('/employee/:id/upload', async function (req, res) {
    let empId = req.params.id

    if (!req.files || !req.files.employeeDocument) {
        let employee = await bsn.getOneEmployee(empId)
        let schedule = await bsn.empSchedule(empId)
        let documents = await bsn.getEmployeeDocuments(empId)

        return res.render('employee_details', {
            title: 'Employee Details',
            username: req.username,
            employee: employee,
            schedule: schedule,
            hasSchedule: schedule !== undefined,
            documents: documents,
            hasDocuments: documents.length > 0,
            uploadError: 'Please choose a PDF document to upload.',
        })
    }

    let file = req.files.employeeDocument
    let validation = await bsn.validateEmployeeDocumentUpload(empId, file)

    if (!validation.success) {
        let employee = await bsn.getOneEmployee(empId)
        let schedule = await bsn.empSchedule(empId)
        let documents = await bsn.getEmployeeDocuments(empId)

        return res.render('employee_details', {
            title: 'Employee Details',
            username: req.username,
            employee: employee,
            schedule: schedule,
            hasSchedule: schedule !== undefined,
            documents: documents,
            hasDocuments: documents.length > 0,
            uploadError: validation.message,
        })
    }

    let uploadPath = path.join(__dirname, 'uploads', 'employee_docs', empId)
    fs.mkdirSync(uploadPath, { recursive: true })

    let safeName = bsn.createSafeDocumentName(file.name)
    let storedName = Date.now() + '-' + safeName
    let fullPath = path.join(uploadPath, storedName)

    await file.mv(fullPath)

    await bsn.saveEmployeeDocumentMetadata(empId, {
        originalName: file.name,
        storedName: storedName,
        mimeType: file.mimetype,
        size: file.size,
    })

    return res.redirect('/employee/' + empId)
})


app.get('/employee/:id/document/:docId', async function (req, res) {
    let empId = req.params.id
    let docId = req.params.docId

    let doc = await bsn.getEmployeeDocument(empId, docId)

    if (!doc) {
        return res.status(404).send('Document not found.')
    }

    let filePath = path.join(__dirname, 'uploads', 'employee_docs', empId, doc.storedName)

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File missing.')
    }

    res.download(filePath, doc.originalName)
})

// ============================================================

app.get('/edit/:id', async (req, res) => {
    let empId = req.params.id
    let employee = await bsn.getOneEmployee(empId)

    res.render('edit_employee', {
        title: 'Edit Employee',
        username: req.username,
        employee: employee,
        error: null,
    })
})

app.post('/edit/:id', async (req, res) => {
    let empId = req.params.id
    let name = req.body.name.trim()
    let number = req.body.phone.trim()

    if (name === '') {
        let employee = await bsn.getOneEmployee(empId)
        return res.render('edit_employee', {
            title: 'Edit Employee',
            username: req.username,
            employee: employee,
            error: 'The name field cannot be empty.',
        })
    }

    if (number.length !== 9 || number[4] !== '-') {
        let employee = await bsn.getOneEmployee(empId)
        return res.render('edit_employee', {
            title: 'Edit Employee',
            username: req.username,
            employee: employee,
            error: 'Phone must be in format XXXX-XXXX.',
        })
    }

    for (let i = 0; i < 4; i++) {
        if (number[i] < '0' || number[i] > '9') {
            let employee = await bsn.getOneEmployee(empId)
            return res.render('edit_employee', {
                title: 'Edit Employee',
                username: req.username,
                employee: employee,
                error: 'Phone must be in format XXXX-XXXX.',
            })
        }
    }

    for (let i = 5; i < 9; i++) {
        if (number[i] < '0' || number[i] > '9') {
            let employee = await bsn.getOneEmployee(empId)
            return res.render('edit_employee', {
                title: 'Edit Employee',
                username: req.username,
                employee: employee,
                error: 'Phone must be in format XXXX-XXXX.',
            })
        }
    }

    await bsn.editEmployee(empId, name, number)
    res.redirect('/')
})

app.listen(8000)