var express = require('express');
var rp = require('request-promise');
var tough = require('tough-cookie');
var moment = require('moment');
var fs = require("fs");
var config = require('./config');
var router = express.Router();
var setmoreSessionId;

router.get('/hours', async function (req, res, next) {
    var hours = await getHours();
    res.send(hours);
});

async function getHours() {
    var timeCards = await getTimeCards();
    var setmoreStaffInfo = await getSetmoreStaffInfo();
    var setmoreHours = await getSetmoreStaffHours();

    var staffHours = setmoreStaffInfo
        .map((staffInfo) => {
            var hoursData = setmoreHours.find((hours) => hours.ResourceKey == staffInfo.key);
            var dayToHoursData = {
                sunday: hoursData.su,
                monday: hoursData.mo,
                tuesday: hoursData.tu,
                wednesday: hoursData.we,
                thursday: hoursData.th,
                friday: hoursData.fr,
                saturday: hoursData.sa
            }
            Object
                .keys(dayToHoursData)
                .forEach((day) => {
                    var dataSplit = dayToHoursData[day].split(',');
                    var startTimeObj = moment(dataSplit[1], 'HH:mm A');
                    var endTimeObj = moment(dataSplit[3], 'HH:mm A');
                    
                    dayToHoursData[day] = endTimeObj.diff(startTimeObj, 'hours', true);
                });


            return {
                name: staffInfo.FirstName + ' ' + staffInfo.LastName,
                hours: dayToHoursData
            };
        });

    return staffHours;
}

async function getSetmoreStaffInfo() {
    await ensureSetmoreSessionValidity();
    var response = await rp({
        uri: 'https://my.setmore.com/Staff?_=1531798949839',
        jar: getSetmoreCookieJar(),
        simple: false
    });

    return JSON.parse(response);
}

async function getSetmoreStaffHours() {
    await ensureSetmoreSessionValidity();
    var response = await rp({
        uri: 'https://my.setmore.com/WorkingHours?_=1531848603632',
        jar: getSetmoreCookieJar(),
        simple: false
    });

    return JSON.parse(response);
}

async function ensureSetmoreSessionValidity() {
    if (!setmoreSessionId) {
        setmoreSessionId = await getSetmoreSessionId();
        await loginToSetmore();
    }
}

async function getSetmoreSessionId() {
    var request = await rp({
        uri: 'https://my.setmore.com/',
        resolveWithFullResponse: true
    });

    return request.headers['set-cookie'][0]
        .split(new RegExp('=|;'), 3)[1];
}

async function loginToSetmore() {
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
        jar: getSetmoreCookieJar(),
        simple: false
    });
}

async function getTimeCards() {
    var response = await rp({
        uri: 'https://www.jobsitetimeclock.com/otc2004web/back/mGetTimeCards.php',
        method: 'POST',
        formData: {
            companyId: '67189',
            employeeId: '-1',
            departmentId: '-1',
            selectedDate: '07/01/2018 - 07/17/2018'
        }
    });

    return JSON.parse(response);
}

function getSetmoreCookieJar() {
    var cookie = new tough.Cookie({
        key: 'JSESSIONID',
        value: setmoreSessionId,
        domain: 'my.setmore.com'
    });
    var cookieJar = rp.jar();
    cookieJar.setCookie(cookie, 'https://my.setmore.com');

    return cookieJar;
}

module.exports = router;