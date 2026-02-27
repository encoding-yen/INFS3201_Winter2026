/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Persistence Layer - Handles the file operations
 */

const { checkPrime } = require('crypto')
const { read } = require('fs')
const fs = require('fs/promises')

/**
 * Parses a number which the function opens and reads the content to be used.
 * 
 * @param {String} file Opens and reads the content of the given file.
 * @returns {Array} Returns the content read from the file and turns it into a JavaScript readable array.
 */
async function readEmployeeData(file) {
    if (file == 1) {
        let raw = await fs.readFile('employees.json', 'utf8')
        return await JSON.parse(raw)
    } else if (file == 2) {
        let raw = await fs.readFile('shifts.json', 'utf8')
        return await JSON.parse(raw)
    } else if (file == 3) {
        let raw = await fs.readFile('assignments.json', 'utf8')
        return await JSON.parse(raw)
    } else if (file == 4){
        let raw = await fs.readFile('config.json', 'utf8')
        return await JSON.parse(raw)
    } else {
        console.log('There was no file passed to read.')
    }
}

/**
 * Writes the strigified array onto an external file.
 * 
 * @param {Array} array[] takes the array and strigify it
 */
async function writeEmployeeData(file, array) {
    let newArr = JSON.stringify(array, null, 2)
    await fs.writeFile(file, newArr)
}

/**
 * Displays all the employees from the .txt file
 * NO parameters are needed to parse.
 * 
 * @returns 
 */
async function allEmployees() {
    let empData = await readEmployeeData(1)
    let data = []
    if (empData.length === 0) {
        data.push(`The file has no records.`)
    } else {
        data.push(`=============================================`)
        data.push(`Employee ID\tName\t\tPhone`)
        data.push(`-----------\t-------------\t-------------`)
        for (c of empData) {
            data.push(`${c.employeeId.padEnd(16)}${c.name.padEnd(20)}${c.phone}`)
        }
        data.push(`=============================================`)
    }
    return data
}

/**
 * Appends a new employee with a new ID.
 * 
 * @param {String} name Takes the employee name as a string.
 * @param {String} num Takes the phone number as a string.
 */
async function addEmployee(name, num) {
    let empData = await readEmployeeData(1)
    let newID = 'E'

    if (empData.length < 10) {
        newID += '00' + String(empData.length + 1)
    } else if (empData.length < 99) {
        newID += '0' + String(empData.length + 1)
    } else {
        newID += String(empData.length + 1)
    }

    let newObj = { "employeeId": newID, "name": name, "phone": num }
    empData.push(newObj)
    await writeEmployeeData("employees.json", empData)
}


/**
 * Prints out the schedule of the given employee ID.
 * 
 * @param {String} employee Takes the employee ID as a string.
 */
async function empSchedule(employee) {
    let shiftID = await readEmployeeData(2)
    let assignID = await readEmployeeData(3)
    let schedule = []

    for (i of assignID) {
        if (i['employeeId'] == employee) {
            let schedID = i['shiftId']
            for (c of shiftID) {
                if (c['shiftId'] == schedID) {
                    schedule.push(`${c['date']}, ${c['startTime']}, ${c['endTime']}`)
                }
            }
        }
    }
    return schedule
}

module.exports = {
    readEmployeeData,
    allEmployees,
    addEmployee,
    empSchedule,
}