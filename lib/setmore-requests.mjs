import rp from 'request-promise';
import tough from 'tough-cookie';
import moment from 'moment';

const {
  setmoreRequestDateTimeFormat,
  setmoreCompanyId,
  setmoreCreateAppointmentToAndFromDateFormat,
  setmoreCreateAppointmentStartAndEndDateFormat,
  setmoreCreateAppointmentStartAndEndTimeFormat,
  setmoreCreateAppointmentDateAndTimeFormat,
  setmoreCreateAppointmentAptStartAndEndDateFormat,
  setmoreUsername,
  setmorePassword
} = process.env;

const sessionIds = [];

async function getStaffInfo() {
  return requestData('https://my.setmore.com/Staff');
}

async function getStaffHours() {
  return requestData('https://my.setmore.com/WorkingHours');
}

async function getStaffBreaks() {
  return requestData('https://my.setmore.com/RestrictedHours');
}

async function getStaffServices() {
  return requestData('https://my.setmore.com/Services');
}

async function getAppointments(staffId, startDateObj, endDateObj) {
  const sessionId = await getSession();
  const response = await rp({
    uri: `https://my.setmore.com/fetchAllAppoointmentsByDate/${staffId}/${startDateObj.format(setmoreRequestDateTimeFormat)}/${moment(endDateObj).add(1, 'days').format(setmoreRequestDateTimeFormat)}`,
    jar: getCookieJar(sessionId)
  });

  // Getting appointments may fail on Setmore's side
  try {
    const appointments = JSON.parse(response).appointments;
    return appointments || [];
  } catch (exception) {
    return getAppointments(staffId, startDateObj, endDateObj);
  }
}

async function createSlotBlocker(staffId, startDateTimeObj, endDateTimeObj, description) {
  const sessionId = await getSession();
  const response = await rp({
    uri: 'https://my.setmore.com/appointment/save',
    method: 'POST',
    body: {
      key: `a${Math.floor(Math.random() * (2 ** 31))}`,
      CUID: setmoreCompanyId,
      Comments: description,
      EndTimeLong: endDateTimeObj.unix() * 1000,
      From_date: endDateTimeObj.format(setmoreCreateAppointmentToAndFromDateFormat),
      StartTimeLong: startDateTimeObj.unix() * 1000,
      To_date: startDateTimeObj.format(setmoreCreateAppointmentToAndFromDateFormat),
      appointmentLabel: '',
      appointmentStatus: null,
      apptflag: 'new',
      cancelledBy: null,
      cancelledDateLong: 0,
      company: null,
      customerKey: 'slotBlocker',
      days: [],
      emailInfo: null,
      endDate: endDateTimeObj.format(setmoreCreateAppointmentStartAndEndDateFormat),
      endTime: endDateTimeObj.hours() * 60 + endDateTimeObj.minutes(),
      eventId: null,
      eventSummary: null,
      frequency: '',
      haveEmailReminderEnabled: 'true',
      haveEmailReminderEnabledStaff: 'false',
      haveRecurring: 'false',
      haveTextReminderEnabled: 'false',
      haveTextReminderEnabledStaff: 'false',
      interval: 0,
      oldStartDate: '',
      paidAmount: null,
      paymentHistory: null,
      paymentRef: null,
      paymentStatus: null,
      recurringEndDate: '',
      recurringKey: '',
      recurringStartDate: '',
      refundStatus: 0,
      refundedAmount: null,
      reminder: 0,
      reminderSentDate: null,
      reminderSentDateStaff: null,
      reminderSentTime: 0,
      reminderSentTimeStaff: 0,
      reminderStaff: 0,
      reminderValue: 61200000,
      reminderValueStaff: 61200000,
      resource: null,
      resourceKey: staffId,
      sentReminderType: null,
      sentReminderTypeStaff: null,
      service: null,
      serviceKey: 'slotBlocker',
      stDate_label: startDateTimeObj.format(setmoreCreateAppointmentStartAndEndDateFormat),
      startDate: startDateTimeObj.format(setmoreCreateAppointmentStartAndEndDateFormat),
      startTime: startDateTimeObj.hours() * 60 + startDateTimeObj.minutes(),
      isPaid: 0,
      isRefund: 0,
      isPaymentProcessing: 0,
      paidFromBookingPage: 0,
      connectURLStatus: '',
      videoUrl: '',
      apptStartTimeStr: startDateTimeObj.format(setmoreCreateAppointmentStartAndEndTimeFormat),
      apptEndTimeStr: endDateTimeObj.format(setmoreCreateAppointmentStartAndEndTimeFormat),
      status: 'confirmed',
      isDependencyUpdated: 'false',
      customer: {
        name: '',
        Ext: '',
        FirstName: '',
        LastName: '',
        LoginId: '',
        MobileNo: '',
        OfficeNumber: '',
        HomeNumber: '',
        Address: '',
        key: '',
        F_Key: setmoreCompanyId,
        CompanyName: '',
        ContactType: 'Customer',
        Status: 'Active',
        SmsNo: '',
        notes: '',
        Title: '',
        Fax: '',
        Website: '',
        Timezone: '',
        Brand: '',
        Accounttype: '',
        CompanyLogoPath: '',
        Password: '',
        Location: '',
        City: '',
        State: '',
        Zip: '',
        Country: '',
        companyLogBlobKey: '',
        appearanceColorCode: '',
        searchTokenSet: [],
        countryCode: '',
        comment: {
          value: ''
        },
        additionalFields: {
          value: ''
        },
        EncryptedPassword: '',
        isNewCustomer: false,
        CustomerTags: [],
        loginType: [],
        haveEmailReminderEnabled: 'false',
        haveTextReminderEnabled: 'false'
      },
      bufferDuration: 0,
      isDragged: false,
      dateAndTime: startDateTimeObj.format(setmoreCreateAppointmentDateAndTimeFormat),
      AptStartDate: startDateTimeObj.format(setmoreCreateAppointmentAptStartAndEndDateFormat),
      AptEndDate: endDateTimeObj.format(setmoreCreateAppointmentAptStartAndEndDateFormat),
      bookingId: '',
      isDoubleBooking: true
    },
    json: true,
    jar: getCookieJar(sessionId)
  });

  return response;
}

// Ensure there are always the same number of sessions
async function getSession() {
  if (sessionIds.length <= 0) { await addSession(); } else { addSession(); }

  return sessionIds.shift();
}

async function addSession() {
  const request = await rp({
    uri: 'https://my.setmore.com/',
    resolveWithFullResponse: true
  });

  const sessionId = request
    .headers['set-cookie'][0]
    .split(new RegExp('=|;'), 3)[1];
  await login(sessionId);
  sessionIds.unshift(sessionId);
}

async function login(sessionId) {
  return rp({
    uri: 'https://my.setmore.com/Login.do',
    method: 'POST',
    form: {
      username: setmoreUsername,
      password: setmorePassword,
      redirect: 'https://my.setmore.com/',
      lostemail: '',
      adminPwd: 'admin'
    },
    jar: getCookieJar(sessionId),
    simple: false
  });
}

function getCookieJar(sessionId) {
  const cookie = new tough.Cookie({
    key: 'JSESSIONID',
    value: sessionId,
    domain: 'my.setmore.com'
  });
  const cookieJar = rp.jar();
  cookieJar.setCookie(cookie, 'https://my.setmore.com');

  return cookieJar;
}

async function requestData(url) {
  const sessionId = await getSession();
  const response = await rp({
    uri: url,
    jar: getCookieJar(sessionId)
  });

  return JSON.parse(response);
}

export default {
  getStaffInfo,
  getStaffHours,
  getStaffBreaks,
  getStaffServices,
  getAppointments,
  createSlotBlocker,
  addSession
};
