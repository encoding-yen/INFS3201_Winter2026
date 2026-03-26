/**
 * Yyan Saguinsin
 * 60306991
 * 
 * Business Layer - Handles the business operations
 */

const perst = require('./persistence')

async function allEmployees(){
    return await perst.allEmployees()
}

async function getOneEmployee(id){
    return await perst.getOneEmployee(id)
}

async function empSchedule(employee){
    return await perst.empSchedule(employee)
}

// Changed the name of the function to editEmployee
async function editEmployee(empId, empName, empNum){
    return await perst.editEmployee(empId, empName, empNum)
}

module.exports = {
    allEmployees,
    getOneEmployee,
    editEmployee,
    empSchedule
}