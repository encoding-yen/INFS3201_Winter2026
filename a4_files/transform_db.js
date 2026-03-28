const mongodb = require('mongodb');

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
    return client.db('infs3201_winter2026')
}


/**
 * Step 1: Uses a set to store the employee IDs for each shift.
 * 
 * @async
 * @param {db} mongo.db Uses the database connection to access the shifts collection.
 * @return {Promise<void>} 
 */
async function newEmployee(db){
    await readEmployeeData()
    let employees = db.collection('shifts')
    let result = await employees.updateMany({ employees: { $exists: false } }, { $set: { employees: [] } })
    console.log(result)
}

/**
 * Step 2: Read the assignment collection and add the employee IDs to the corresponding shifts.
 *
 * @async
 * @param {db} mongo.db Uses the database connection to access the collections.
 * @return {Promise<void>} 
 */
async function addEmployeesToShifts(db){
    await readEmployeeData()
    let assign = db.collection('assignments')
    let shifts = db.collection('shifts')
    let employee = db.collection('employees')

    let allAssign = await assign.find().toArray()

    for (let i = 0; i < allAssign.length; i++){

        let empId = await employee.findOne({ employeeId: assign.employeeId })
        if (!empId){
            console.log(`Employee ID: ${assign.employeeId} not found in employees collection.`)
            continue
        }

        let shiftId = await shifts.findOne({ shiftId: assign.shiftId })
        if (!shiftId){
            console.log(`Shift ID: ${assign.shiftId} not found in shifts collection.`)
            continue
        }

        await shifts.updateOne({ shiftId: assign.shiftId }, { $addToSet: { employees: assign.employeeId } })
    }
}

/**
 * Step 3.1: Remove the employeeIDs from the employee collection.
 * 
 * @async
 * @param {db} mongo.db Uses the database connection to access the collections.
 * @return {Promise<void>}  
 */
async function removeEmpId(db){
    await readEmployeeData()
    let employees = db.collection('employees')
    let result = await employees.updateMany({}, { $unset: { employeeId: "" } })
    console.log(result)
}

/**
 * Step 3.2: Remove the shiftId from the shift collection. 
 * 
 * @async
 * @param {db} mongo.db Uses the database connection to access the collections.
 * @return {Promise<void>}
 */
async function removeShiftId(db){
    await readEmployeeData()
    let shifts = db.collection('shifts')
    let result = await shifts.updateMany({}, { $unset: { shiftId: "" } })
    console.log(result)
}

/**
 * Step 3.3: Remove the assignment collection completely.
 * 
 * @async
 */
async function removeEmpIdFromAssign(db){
    await readEmployeeData()
    let result = await db.collection('assignments').drop()
    console.log(result)
}

/**
 * Run the transformation steps in order.
 * 
 * @async
 * @params {db} mongo.db Uses the database connection to access the collections.
 * @returns {Promise<void>}
 */
async function transformDB(){
    let db = await readEmployeeData()
    if(!db){
        console.log("Failed to connect to the database.")
        return
    } else {
        await newEmployee(db)
        await addEmployeesToShifts(db)
        await removeEmpId(db)
        await removeShiftId(db)
        await removeEmpIdFromAssign(db)
    }
}

transformDB()