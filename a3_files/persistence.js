/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Persistence Layer - Handles the file operations
 */

const fs = require('fs/promises')
const mongodb = require('mongodb')

let client = undefined

/**
 * Reads the database from the given cluster.
 * 
 * @async
 * @function readEmployeeData
 * @returns {Promise<Array<Object>>} Provides the connection to the database.
 */
async function readEmployeeData() {
    client = new mongodb.MongoClient('mongodb+srv://readOnly:12class34@cluster0.xhwpjs2.mongodb.net/')
    await client.connect()
}

/**
 * Displays all the employees from the .txt file
 * 
 * @returns 
 */
async function allEmployees() {
    await readEmployeeData()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let result = employees.find()
    // console.log(result)
    return result.toArray()
}

/**
 * Returns the matching employee.
 * 
 * @async
 * @function getOneEmployee
 * @param {id} id Takes a string as the input.
 * @returns {Promise<Array<Object>>} Returns only the matching employee.
 */
async function getOneEmployee(id){
    await readEmployeeData()
    let db = client.db('infs3201_winter2026')
    let employees = db.collection('employees')
    let result = await employees.findOne({ employeeId: id })
    console.log(result)
    return result
}

/**
 * Prints out the schedule of the given employee ID.
 * 
 * @param {String} employee Takes the employee ID as a string.
 */
async function empSchedule(employee) {
    await readEmployeeData()
    let db = client.db('infs3201_winter2026')
    let assign = db.collection('assignments')
    let shifts = await assign.find({ employeeId: employee }).toArray()

    if (shifts.length === 0) {
        return undefined
    }

    let sId = []
    for (let i = 0; i < shifts.length; i++) {
        sId.push(shifts[i].shiftId)
    }

    let schedule = db.collection('shifts')
    let result = await schedule.find({ shiftId: {$in: sId }}).toArray()
    // console.log(result)

    return result
}

/**
 * Appends a new employee with a new ID.
 * 
 * @async
 * @function editEmployee
 * @param {String} name Takes the employee name as a string.
 * @param {String} num Takes the phone number as a string.
 * @returns {}
 */
async function editEmployee(empId, empName, empNum) {
    await readEmployeeData()
    let db = client.db('infs3201_winter2026')
    let edited = db.collection('employees')
    let result = await edited.updateOne({ employeeId: empId },{ $set: { name: empName, phone: empNum } })
    return
}

module.exports = {
    readEmployeeData,
    allEmployees,
    getOneEmployee,
    editEmployee,
    empSchedule,
}