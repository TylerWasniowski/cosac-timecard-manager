var rp = require('request-promise');
var tough = require('tough-cookie');

var config = require('../config');

var sessionIds = [];

async function getStaffInfo() {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/Staff?_=1531798949839',
        jar: getCookieJar(sessionId)
    });

    return JSON.parse(response);
}

async function getStaffHours() {
    var sessionId = await getSession();
    var response = await rp({
        uri: 'https://my.setmore.com/WorkingHours?_=1531848603632',
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
            '/' + endDateObj.format(config.setmoreRequestDateTimeFormat) +
            '?_=1533062166354&dailyStaffKeysList=null',
        jar: getCookieJar(sessionId)
    });
    
    try {
        var appointments = JSON.parse(response).appointments;
        return appointments ? appointments : [];
    } catch (exception) {
        return await getAppointments(staffId, startDateObj, endDateObj);
    }
}

// Ensure there are always the same number of sessions
async function getSession() {
    await addSession();
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
    addSession
};