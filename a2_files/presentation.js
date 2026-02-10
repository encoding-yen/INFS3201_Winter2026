/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Presentation Layer - Handles the UI functionalities
 */

const prompt = require('prompt-sync')()
const bsn = require('./business')

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