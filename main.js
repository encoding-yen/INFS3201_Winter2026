/**
 * Yyan Saguinsin
 * 60306991
 */

const { read } = require('fs')
const fs = require('fs/promises')
const prompt = require('prompt-sync')()

/**
 * 
 * 
 * @param {String} file Opens and reads the content of the given file.
 * @returns {Array} Returns the content read from the file and turns it into a JavaScript readable array.
 */
async function readEmployeeData(file) {
    if (file == 1) {
        let raw = await fs.readFile('test.json')
        return await JSON.parse(raw)
    } else if (file == 2) {
        let raw = await fs.readFile('shifts.json')
        return await JSON.parse(raw)
    } else if (file == 3) {
        let raw = await fs.readFile('assignTest.json')
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
async function writeEmployeeData(array) {
    let newArr = JSON.stringify(array, null, 2)
    await fs.writeFile('assignTest.json', newArr)
}

/**
 * Displays all the employees from the .txt file
 * NO parameters are needed to parse.
 */
async function allEmployees() {
    let empData = await readEmployeeData(1)
    if (empData.length === 0) {
        console.log(`The file has no records.`)
    } else {
        console.log(`=============================================`)
        console.log(`Employee ID\tName\t\tPhone`)
        console.log(`-----------\t-------------\t-------------`)
        for (c of empData) {

            console.log(`${c.employeeId.padEnd(16)}${c.name.padEnd(20)}${c.phone}`)
        }
        console.log(`=============================================`)
    }
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
    await writeEmployeeData(empData)
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

    for (e of empData){
        if (e['employeeId'] == employee){
            for (s of shiftData){
                if (s['shiftId'] == shift){
                    let newShift = { "employeeId": employee, "shiftId": shift}
                    assignData.push(newShift)
                    await writeEmployeeData(assignData)
                }
            }
            console.log(`The shift ${shift} does not exist.`)
        }
    }
    console.log(`The employee ID ${employee} does not exist`)
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
    
    if (schedule.length != 0){
            console.log(`========================`)
            console.log(`date, startTime, endTime`)
            for (s of schedule){
                console.log(s)
            }
            console.log(`========================`)
    } else {
        console.log(`=================================================`)
        console.log(`The employee ID: ${employee} does not have a schedule.`)
        console.log(`=================================================`)
    }
}

/**
 * Main interface of the app
 */
async function main() {
    while (true) {
        console.log(`1. Show all employees`)
        console.log(`2. Add new employee`)
        console.log(`3. Assign employee to shift`)
        console.log(`4. View employee schedule`)
        console.log(`5. Exit`)

        let choice = Number(prompt("What is your choice> "))

        if (choice == 1) {
            await allEmployees()
        } else if (choice == 2) {
            let empName = prompt(`Enter employee name: `)
            let number = prompt(`Enter phone number: `)
            await addEmployee(empName, number)
            console.log(`Employee added...`)
        } else if (choice == 3) {
            let empID = prompt("Enter employee ID: ").toUpperCase()
            let shiftID = prompt("Enter shift ID: ").toUpperCase()
            await assignShift(empID, shiftID)
        } else if (choice == 4) {
            let empID = prompt("Enter employee ID: ").toUpperCase()
            await empSchedule(empID)
        } else if (choice == 5) {
            break
        } else {
            console.log('=============================================')
            console.log("***Error! Please enter one of the options.***")
            console.log('=============================================')
        }
    }
}

main()