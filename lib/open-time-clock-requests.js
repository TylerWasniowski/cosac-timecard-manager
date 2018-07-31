var rp = require('request-promise');

var config = require('../config');

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

async function getStaffHours(startDateObj, endDateObj) {
    var response = await rp({
        uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetTimeCards.php',
        method: 'POST',
        formData: {
            companyId: config.openTimeClockCompanyId,
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