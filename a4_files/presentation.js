/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Presentation Layer - Handles the UI functionalities
 */

const bsn = require('./business')
const express = require('express')
const { engine } = require('express-handlebars')
const crypto = require('crypto')
const app = express()

// Handlebars setup
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/templates',
}))
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/templates')

app.use(express.urlencoded({ extended: true }))

// Session duration: 300 seconds (5 minutes)
const duration = 300

/**
 * Generates a random session token.
 * 
 * @returns {String} A random hex session token.
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex')
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
        if (session && session.expiresAt > Date.now()) {
            username = session.username
        }
    await bsn.logAccess(username, req.url, req.method)
    }
    next()
}

app.use(accessLogMiddleware)

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
    if (req.path === '/login' || req.path === '/logout') {
        return next()
    }

    let token = getTokenFromCookie(req)
    console.log('=== AUTH path:', req.path, 'token:', token ? token.slice(0,10)+'...' : 'none')
    if (!token) {
        console.log('=== AUTH: no token, rendering login')
        return res.render('login', { title: 'Login', message: 'Please log in to continue.' })
    }

    let session = await bsn.getSession(token)
    console.log('=== AUTH: session found:', session ? 'yes, expires:'+session.expiresAt+' now:'+Date.now() : 'no')
    if (!session) {
        console.log('=== AUTH: no session, rendering login')
        return res.render('login', { title: 'Login', message: 'Please log in to continue.' })
    }

    if (session.expiresAt <= Date.now()) {
        console.log('=== AUTH: session expired')
        await bsn.deleteSession(token)
        return res.render('login', { title: 'Login', message: 'Your session has expired. Please log in again.' })
    }

    await bsn.updateSession(token, Date.now() + (duration * 1000))
    req.username = session.username
    console.log('=== AUTH: passed, user:', session.username)
    next()

    console.error('=== AUTH error:', err)
    return res.render('login', { title: 'Login', message: 'An error occurred. Please log in again.' })
    
}

app.use(authenticate)

// Login and Logout routes
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        message: null,
    })
})

app.post('/login', async (req, res) => {
    let username = req.body.username.trim()
    let password = req.body.password

    let user = await bsn.authenticateUser(username, password)

    if (!user) {
        return res.render('login', {
            title: 'Login',
            message: 'Invalid username or password.',
        })
    }

    let token = generateToken()
    console.log('=== LOGIN: creating session, token:', token)
    await bsn.createSession(token, user.username, Date.now() + (duration * 1000))
    console.log('=== LOGIN: session created, setting cookie and redirecting')
    res.cookie('sessionToken', token, { httpOnly: true, maxAge: duration * 1000 })
    res.redirect('/')
})

app.get('/logout', async (req, res) => {
    let token = getTokenFromCookie(req)
    if (token) {
        await bsn.deleteSession(token)
    }
    res.clearCookie('sessionToken')
    res.render('login', {
        title: 'Login',
        message: 'You have been logged out.',
    })
})

// Protected application routes
app.get('/', async (req, res) => {
    let employees = await bsn.allEmployees()
    res.render('all_employees', {
        title: 'List of Employees',
        username: req.username,
        employees: employees,
    })
})

app.get('/employee/:id', async (req, res) => {
    let empId = req.params.id
    let employee = await bsn.getOneEmployee(empId)
    let schedule = await bsn.empSchedule(empId)

    res.render('employee_details', {
        title: 'Employee Details',
        username: req.username,
        employee: employee,
        schedule: schedule,
        hasSchedule: schedule !== undefined,
    })
})

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