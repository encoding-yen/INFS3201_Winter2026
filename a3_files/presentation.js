/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Presentation Layer - Handles the UI functionalities
 */

const fs = require('fs/promises')
const bsn = require('./business')
const express = require('express')
const app = express()

app.get('/', async (req, res) => {
    let emp = await bsn.allEmployees()
    // console.log(emp)
    let data = ""
    for (e of emp){
        data += `<li><a href="/employee/${e.employeeId}">${e.name}</li>`
    }
    
    res.send(`
        <h1>List of Employees</h1>
        <ul>${data}</ul>
        `)
})

app.get('/employee/:id', async(req, res) => {
    let empId = req.params.id
    let employee = await bsn.getOneEmployee(empId)
    let schedule = await bsn.empSchedule(empId)
    // console.log(empId, employee)

    let result = `<tr><th>Date</th><th >Start Time</th><th>End Time</th></tr>`

    if (schedule === undefined){
        res.send(`
            <style>
                table tr:nth-child(3) td:nth-child(2) {
                    background-color: yellow;
                }
            </style>
            <h1>Employee Details</h1>
            <p>Name: ${employee.name}</p>
            <p>Phone: ${employee.phone}</p>
            <a href="/edit/${employee.employeeId}">Edit Details</a>

            <h2>Shifts</h2>
            <table>${result}</table>
        `)

    } else {
        for (let i = 0; i < schedule.length; i++){
            result += `<tr>
                <td>${schedule[i].date}</td>
                <td>${schedule[i].startTime}</td>
                <td>${schedule[i].endTime}</td>
            </tr>`
        }

        res.send(`
            <style>
                table tr:nth-child(3) td:nth-child(2) {
                    background-color: yellow;
                }
            </style>
            <h1>Employee Details</h1>
            <p>Name: ${employee.name}</p>
            <p>Phone: ${employee.phone}</p>
            <a href="/edit/${employee.employeeId}">Edit Details</a>

            <h2>Shifts</h2>
            <table>${result}</table>
            `)
        }
})

app.get('/edit/:id', async(req, res) => {
    let empId = req.params.id
    let employee = await bsn.getOneEmployee(empId)
    
    // console.log(empId)

    res.send(`
        <h1>Edit</h1>
        <form method='POST' action='/edit/${employee.employeeId}'>
            <label>Name: <input type="text" name="name" value="${employee.name}"></label><br>
            <label>Phone: <input type="text" name="phone" value="${employee.phone}"></label><br>
            <button type="submit">Save</button>
        </form>
        `)
})

app.use(express.urlencoded({ extended: true }))

app.post('/edit/:id', async(req, res) => {
    let empId = req.params.id
    let name = req.body.name.trim()
    let number = req.body.phone.trim()

    if (name === '' || name === null){
        return res.send(`The field name can not be empty`)
    }

    if (number.length !== 9 || number[4] !== '-') {
        return res.send('Phone must be in format XXXX-XXXX')
    }

    for (let i = 0; i < 4; i++) {
        if (number[i] < '0' || number[i] > '9') {
            return res.send('Phone must be in format XXXX-XXXX')
        }
    }

    for (let i = 5; i < 9; i++) {
        if (number[i] < '0' || number[i] > '9') {
            return res.send('Phone must be in format XXXX-XXXX')
        }
    }

    await bsn.editEmployee(empId, name, number)

    res.redirect('/')
})

app.listen(8000)
