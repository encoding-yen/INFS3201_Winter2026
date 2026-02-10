/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Presentation Layer - Handles the UI functionalities
 */

const prompt = require('prompt-sync')()
const fs = require('fs/promises')
const bsn = require('./business')

/**
 * Prints the data from the function allEmployees.
 * 
 * @param {Array} data[] Takes an array as input.
 * @returns {console.log} Prints out each value of the array.
 */
async function printEmployees(data){
    if (data.length === 0) {
        console.log(`========================`)
        console.log(`The file has no records.`)
        console.log(`========================`)
    } else {
        for (c of data) {
            console.log(c)
        }
    }
}

/**
 * Prints the schedule data of the employees.
 * 
 * @param {Array} data[] Takes an array as input.
 * @returns {console.log} Prints out each value of the array.
 */
async function printSchedule(data){
    if (data.length != 0){
            console.log(`========================`)
            console.log(`date, startTime, endTime`)
            for (s of data){
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
 * Prints the assignments data of the employees.
 * 
 * @param {Array} data[] Takes an array as input.
 * @returns {console.log} Prints out each value of the array.
 */
async function printAssigned(data){
    if (data.length === 0){
        console.log(``)
    } else {
        for (d of data){
            console.log(d)
        }
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
            data = await bsn.allEmployees()
            await printEmployees(data)
        } else if (choice == 2) {
            let empName = prompt(`Enter employee name: `)
            let number = prompt(`Enter phone number: `)
            data = await bsn.addEmployee(empName, number)

        } else if (choice == 3) {
            let empID = prompt("Enter employee ID: ").toUpperCase()
            let shiftID = prompt("Enter shift ID: ").toUpperCase()
            data = await bsn.assignShift(empID, shiftID)
            await printAssigned(data)

        } else if (choice == 4) {
            let empID = prompt("Enter employee ID: ").toUpperCase()
            data = await bsn.empSchedule(empID)
            await printSchedule(data)

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