import rp from 'request-promise';
import config from '../config';

async function getStaffInfo() {
  const response = await rp({
    uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetEmployees.php',
    method: 'POST',
    formData: {
      companyId: config.openTimeClockCompanyId,
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
    formData: {
      companyId: config.openTimeClockCompanyId,
      employeeId: '-1',
      departmentId: '-1',
      selectedDate: startDateObj.format(config.openTimeClockDateFormat)
                + config.openTimeClockDateSeparator
                + endDateObj.format(config.openTimeClockDateFormat)
    }
  });

  return JSON.parse(response);
}

export default {
  getStaffInfo,
  getStaffHours
};
