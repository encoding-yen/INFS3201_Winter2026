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
 * Assigns a shift to an employee using their IDs.
 * 
 * @param {String} employee Takes an employee ID as a string.
 * @param {String} shift Takes a shift ID as a string
 */
async function assignShift(employee, shift) {
    let empData = await readEmployeeData(1)
    let shiftData = await readEmployeeData(2)
    let assignData = await readEmployeeData(3)
    let result = []

    for (a of assignData){
        if (a['shiftId'] == shift){
            result.push(`===================================`)
            result.push(`Employee already assigned to shift.`)
            result.push(`===================================`)
        }
    }

    empCheck = false
    for (e of empData) {
        if (e['employeeId'] == employee){
            empCheck = true
        }
    }
    
    if (empCheck){
        let emp = employee
    } else {
        result.push(`===================================`)
        result.push(`Employee does not exist`)
        result.push(`===================================`)
    }

    shiftCheck = false
    for (s of shiftData) {
        if (s['shiftId'] == shift){
            shiftCheck = true
        }
    }

    if (shiftCheck){
        
        let dailyHours = await checkLimit(employee, shift)

        if (dailyHours === undefined){
            return undefined
        } else if (dailyHours){
            let newShift = { "employeeId": employee, "shiftId": shift}
            assignData.push(newShift)
            await writeEmployeeData("assignments.json", assignData)
        } else {
            result.push(`=======================================================`)
            result.push(`Employee already has the max amount of hours for today.`)
            result.push(`=======================================================`)
        }

    } else {
        result.push(`===================================`)
        result.push(`Shift does not exist`)
        result.push(`===================================`)
    }

    return result
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

/**
 * Gets the employee hours for the given day
 * 
 * @param {String} empId Takes the empId as a string.
 * @param {String} date Takes the date as a string.
 * @returns {int} Returns the total hours of the employee for that day.
 */
async function getEmployeeHoursForDate(empId, date) {
    let assignments = await readEmployeeData(3)
    let totalHours = 0

    for (let a of assignments) {
        if (a.employeeId === empId) {
            let shifts = await readEmployeeData(2)
            for (let s of shifts) {
                if (s.shiftId === a.shiftId && s.date === date) {
                    let hours = await computeShiftDuration(s.startTime, s.endTime)
                    totalHours += hours
                }
            }
        }
    }

    return totalHours
}

/**
 * Checks the daily hours limit for an employee
 * 
 * @param {String} empId Takes the empId as a string.
 * @param {String} sId Takes the shiftId as a string.
 * @returns {boolean} Returns true, false or undefined.
 */
async function checkLimit(empId, sId) {
    let shifts = await readEmployeeData(2)
    let targetShift = undefined
    
    for (let s of shifts) {
        if (s.shiftId === sId) {
            targetShift = s
        }
    }
    
    if (targetShift === undefined) {
        return undefined
    }
    
    let config = await readEmployeeData(4)
    let currHours = await getEmployeeHoursForDate(empId, targetShift.date)
    let shiftDur = await computeShiftDuration(targetShift.startTime, targetShift.endTime)
    
    if (currHours + shiftDur > config.maxDailyHours) {
        return false
    }
    return true
}

/**
 * Computes the duration of a shift in hours.
 * LLM: Claude
 * Prompt: Write a JavaScript function that takes two time strings in HH:MM format and returns the duration in hours as a decimal number
 * 
 * @param {String} startTime Start time in HH:MM format
 * @param {String} endTime End time in HH:MM format
 * @returns {Number} Duration in hours as a decimal
 */
async function computeShiftDuration(startTime, endTime) {
    let startParts = startTime.split(":")
    let startHours = Number(startParts[0])
    let startMinutes = Number(startParts[1])
    
    let endParts = endTime.split(":")
    let endHours = Number(endParts[0])
    let endMinutes = Number(endParts[1])
    
    let startTotalMinutes = startHours * 60 + startMinutes
    let endTotalMinutes = endHours * 60 + endMinutes
    
    let durationMinutes = endTotalMinutes - startTotalMinutes
    return durationMinutes / 60
}

module.exports = {
    readEmployeeData,
    allEmployees,
    addEmployee,
    assignShift,
    empSchedule,
}