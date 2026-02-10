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

async function addEmployee(name, num){
    return await perst.addEmployee(name, num)
}

async function assignShift(employee, shift){
    
    return await perst.assignShift(employee, shift)
}

async function empSchedule(employee){
    return await perst.empSchedule(employee)
}

module.exports = {
    allEmployees,
    addEmployee,
    assignShift,
    empSchedule
}