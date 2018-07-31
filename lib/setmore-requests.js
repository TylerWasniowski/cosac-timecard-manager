var rp = require('request-promise');
var tough = require('tough-cookie');

var config = require('../config');

var sessionId;

async function getStaffInfo() {
    await ensureSessionValidity();
    var response = await rp({
        uri: 'https://my.setmore.com/Staff?_=1531798949839',
        jar: getCookieJar(),
        simple: false
    });

    return JSON.parse(response);
}

async function getStaffHours() {
    await ensureSessionValidity();
    var response = await rp({
        uri: 'https://my.setmore.com/WorkingHours?_=1531848603632',
        jar: getCookieJar(),
        simple: false
    });

    return JSON.parse(response);
}

async function getAppointments() {
    await ensureSessionValidity();
    var response = await rp({
        uri: 'https://my.setmore.com/fetchAllAppoointmentsByDate/r81b31507250233588/29-Jul-2018-00:00:00/05-Aug-2018-00:00:00?_=1533062166354&dailyStaffKeysList=null'
    })
}

async function ensureSessionValidity() {
    if (!sessionId) {
        sessionId = await getSessionId();
        await login();
    }
}

async function getSessionId() {
    var request = await rp({
        uri: 'https://my.setmore.com/',
        resolveWithFullResponse: true
    });

    return request.headers['set-cookie'][0]
        .split(new RegExp('=|;'), 3)[1];
}

async function login() {
    return await rp({
        uri: 'https://my.setmore.com/Login.do',
        method: 'POST',
        form: {
            username: config.setmoreUsername,
            password: config.setmorePassword,
            redirect: 'https://my.setmore.com/',
            lostemail: '',
            adminPwd: 'admin'
        },
        jar: getCookieJar(),
        simple: false
    });
}

function getCookieJar() {
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
    getStaffHours
};