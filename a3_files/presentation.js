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
    console.log(emp)
    let data = ""
    for (e of emp){
        data += `<li><a href="/employee/${e.id}>">${e.name}</li>`
    }
    
    res.send(`
        <h1>List of Employees</h1>
        <ul>${data}</ul>
        `)
})

app.listen(8000)
