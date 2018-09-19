import rp from 'request-promise';

const {
  openTimeClockCompanyId,
  openTimeClockDateFormat,
  openTimeClockDateSeparator
} = process.env;

async function getStaffInfo() {
  const response = await rp({
    uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetEmployees.php',
    method: 'POST',
    form: {
      companyId: openTimeClockCompanyId,
      departmentId: '-1',
      Inactive: 'hide'
    }
  });

  return JSON.parse(response);
}

async function getStaffHours(startDateObj, endDateObj) {
  const response = await rp({
    uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetTimeCards.php',
    method: 'POST',
    form: {
      companyId: openTimeClockCompanyId,
      employeeId: '-1',
      departmentId: '-1',
      selectedDate: startDateObj.format(openTimeClockDateFormat)
                + openTimeClockDateSeparator
                + endDateObj.format(openTimeClockDateFormat)
    }
  });

  return JSON.parse(response);
}

export default {
  getStaffInfo,
  getStaffHours
};
