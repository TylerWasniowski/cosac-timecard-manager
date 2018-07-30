var rp = require('request-promise');

async function getStaffInfo() {
    var response = await rp({
        uri: "https://www.jobsitetimeclock.com/otc2004web/back/mGetEmployees.php",
        method: "POST",
        formData: {
            companyId: '67189',
            departmentId: '-1',
            Inactive: 'hide'
        }
    });

    return JSON.parse(response);
}

async function getStaffHours(startDate, endDate) {
    var response = await rp({
        uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetTimeCards.php',
        method: 'POST',
        formData: {
            companyId: '67189',
            employeeId: '-1',
            departmentId: '-1',
            selectedDate: startDate + ' - ' + endDate
        }
    });

    return JSON.parse(response);
}

module.exports = {
    getStaffInfo,
    getStaffHours
};