var rp = require('request-promise');
var tough = require('tough-cookie');
var moment = require('moment');

var config = require('../config');

var sessionIds = [];

async function getStaffInfo() {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/Staff',
        jar: getCookieJar(sessionId)
    });

    return JSON.parse(response);
}

async function getStaffHours() {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/WorkingHours',
        jar: getCookieJar(sessionId)
    });

    return JSON.parse(response);
}

async function getAppointments(staffId, startDateObj, endDateObj) {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/fetchAllAppoointmentsByDate' +
            '/' + staffId +
            '/' + startDateObj.format(config.setmoreRequestDateTimeFormat) +
            '/' + moment(endDateObj).add(1, 'days').format(config.setmoreRequestDateTimeFormat),
        jar: getCookieJar(sessionId)
    });

    try {
        var appointments = JSON.parse(response).appointments;
        return appointments ? appointments : [];
    } catch (exception) {
        return await getAppointments(staffId, startDateObj, endDateObj);
    }
}

async function createSlotBlocker(staffId, startDateTimeObj, endDateTimeObj, description) {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/appointment/save',
        method: 'POST',
        body: {
            key: 'a' + Math.floor(Math.random() * Math.pow(2, 31)),
            CUID: config.setmoreCompanyId,
            Comments: description,
            EndTimeLong: endDateTimeObj.unix() * 1000,
            From_date: endDateTimeObj.format(config.setmoreCreateAppointmentToAndFromDateFormat),
            StartTimeLong: startDateTimeObj.unix() * 1000,
            To_date: startDateTimeObj.format(config.setmoreCreateAppointmentToAndFromDateFormat),
            appointmentLabel: '',
            appointmentStatus: null,
            apptflag: 'new',
            cancelledBy: null,
            cancelledDateLong: 0,
            company: null,
            customerKey: 'slotBlocker',
            days: [],
            emailInfo: null,
            endDate: endDateTimeObj.format(config.setmoreCreateAppointmentStartAndEndDateFormat),
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
            stDate_label: startDateTimeObj.format(config.setmoreCreateAppointmentStartAndEndDateFormat),
            startDate: startDateTimeObj.format(config.setmoreCreateAppointmentStartAndEndDateFormat),
            startTime: startDateTimeObj.hours() * 60 + startDateTimeObj.minutes(),
            isPaid: 0,
            isRefund: 0,
            isPaymentProcessing: 0,
            paidFromBookingPage: 0,
            connectURLStatus: '',
            videoUrl: '',
            apptStartTimeStr: startDateTimeObj.format(config.setmoreCreateAppointmentStartAndEndTimeFormat),
            apptEndTimeStr: endDateTimeObj.format(config.setmoreCreateAppointmentStartAndEndTimeFormat),
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
                F_Key: config.setmoreCompanyId,
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
            dateAndTime: startDateTimeObj.format(config.setmoreCreateAppointmentDateAndTimeFormat),
            AptStartDate: startDateTimeObj.format(config.setmoreCreateAppointmentAptStartAndEndDateFormat),
            AptEndDate: endDateTimeObj.format(config.setmoreCreateAppointmentAptStartAndEndDateFormat),
            bookingId: '',
            isDoubleBooking: true
        },
        json: true,
        jar: getCookieJar(sessionId)
    });

    return rp({
        uri: 'https://my.setmore.com/Login.do',
        method: 'POST',
        form: {
            username: config.setmoreUsername,
            password: config.setmorePassword,
            redirect: 'https://my.setmore.com/',
            lostemail: '',
            adminPwd: 'admin'
        },
        jar: getCookieJar(sessionId),
        simple: false
    });
}

// Ensure there are always the same number of sessions
async function getSession() {
    if (sessionIds.length <= 0)
        await addSession();
    else
        addSession();

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
            username: config.setmoreUsername,
            password: config.setmorePassword,
            redirect: 'https://my.setmore.com/',
            lostemail: '',
            adminPwd: 'admin'
        },
        jar: getCookieJar(sessionId),
        simple: false
    });
}

function getCookieJar(sessionId) {
    var cookie = new tough.Cookie({
        key: 'JSESSIONID',
        value: sessionId,
        domain: 'my.setmore.com'
    });
    var cookieJar = rp.jar();
    cookieJar.setCookie(cookie, 'https://my.setmore.com');

    return cookieJar;
}

module.exports = {
    getStaffInfo,
    getStaffHours,
    getAppointments,
    createSlotBlocker,
    addSession
};