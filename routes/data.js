// TODO: Clean up this file by splitting functions into different files
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:SS';
const OPENTIMECLOCK_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:SS';
const SETMORE_TIME_FORMAT = 'HH:mm A';

var express = require('express');
var rp = require('request-promise');
var tough = require('tough-cookie');
var moment = require('moment');
var fs = require("fs");
var config = require('../config');

var router = express.Router();
var setmoreSessionId;


router.get('/hours', async function (req, res, next) {
    var data = JSON.parse(req.body);
    var hours = await getHours(data.payPeriod);
    res.send(hours);
});

// TODO: Separate into separate functions
async function getHours(payPeriod) {
    var timeCards = await getTimeCards();
    var setmoreStaffInfo = await getSetmoreStaffInfo();
    var setmoreData = await getSetmoreStaffHours();

    // Transform OpenTimeClock data to this format:
    /*
    {
        'MM/DD/YYYY': {
            onIntervals: [{startObj: momentObj, endObj: momentObj}, ...]
            offIntervals: [{startObj: momentObj, endObj: momentObj}, ...]
        },
        ...
    }
    */
    var datesToIntervals = {};
    var payPeriodStartObj = moment(payPeriod.start);
    var payPeriodEndObj = moment(payPeriod.end);
    // Populate all the dates from the start to the end (inclusive) with empty interval objects
    while(payPeriodStartObj.isSameOrBefore(payPeriodEndObj)) {
        datesToIntervals[payPeriodStartObj.format(DATE_FORMAT)] = {
            onIntervals: [],
            offIntervals: []
        };
        payPeriodStartObj.add(1, 'd');
    }
    timeCards.forEach((entry) => {
        var startDateTimeObj = moment(entry.InDateTime, OPENTIMECLOCK_DATETIME_FORMAT);
        var endDateTimeObj = moment(entry.OutDateTime, OPENTIMECLOCK_DATETIME_FORMAT);

        var intervalsObj = datesToIntervals[startDateTimeObj.format(DATE_FORMAT)];

        var insertIndex = binarySearch(intervalsObj.onIntervals, startDateTimeObj);
        var intervalObj = {
            startObj: startDateTimeObj,
            endObj: endDateTimeObj
        };
        intervalsObj.onIntervals.splice(insertIndex, 0, intervalObj);
    });

    var staffHours = setmoreStaffInfo
        .map((staffInfo) => {            
            // Transform Setmore data to this format:
            /*
            {
                sunday: {startObj: momentObj, endObj: momentObj},
                ...,
                saturday: {startObj: momentObj, endObj, momentObj}
            }
            */
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
                    dayToHoursData[day] = {
                        startObj: moment(dataSplit[1], SETMORE_TIME_FORMAT),
                        endObj: moment(dataSplit[3], SETMORE_TIME_FORMAT)
                    };
                });

            simplifyIntervals(datesToIntervals.onIntervals);
            for (var date in datesToIntervals) {
                if (datesToIntervals.hasOwnProperty(date)) {
                    var dateObj = moment(date, DATE_FORMAT);
                    var day = dateObj
                        .format('dddd')
                        .toLowerCase();
                    var dayHoursData = dayToHoursData[day];
                    var firstInterval = datesToIntervals[date].onIntervals[0];
                    var lastInterval = datesToIntervals[date].onIntervals[onIntervals.length - 1];

                    if (onIntervals.length > 0) {
                        firstInterval.startObj = moment.max(dayHoursData.startObj, firstInterval.startObj);
                        lastInterval.endObj = moment.min(dayHoursData.endObj, lastInterval.endObj);        
                    }
                }
            }


            return {
                name: staffInfo.FirstName + ' ' + staffInfo.LastName,
                hours: datesTo
            };
        });

    return staffHours;
}

// Repeatedly merges intervals until array is simplified
// Array must be sorted by startObjs
function simplifyIntervals(intervals) {
    for (var i = 0; i < intervals.length - 1; i++) {
        if (intervals[i + 1].startObj.isSameOrBefore(intervals[i].endObj)) {
            // Merge the two intervals
            intervals[i].endObj = moment.max(intervals[i].endObj, intervals[i + 1].endObj);
            intervals.splice(i + 1, 1);
            i--;
        }
    }
}

function findIntervalsDifference(a, b) {
    var difference = a.map(interval => {
        return {
            startObj: moment(interval.startObj),
            endObj: moment(interval.endObj)
    };});
    var i = 0;
    var j = 0;
    while (i < difference.length && j < b.length) {
        var j = binarySearch(b, difference[j].startObj, j, b.length - 1, false);

        if (difference[i].startObj.isBefore(b[j].endObj) && difference[i].endObj.isAfter(b[j].startObj)) {
            if (difference[i].startObj.isSameOrAfter(b[j].startObj)) {
                difference[i] = {
                    startObj: b[j].endObj,
                    endObj: difference[i].startObj
                };
            }
            if (difference[i].endObj.isSameOrBefore(b[j].endObj)) {
                difference[i] = {
                    startObj: difference[i].startObj,
                    endObj: b[j].startObj
                };
            }
            if (difference[i].startObj.isBefore(b[j].startObj) && difference[i].endObj.isAfter(b[j].endObj)) {
                // Split interval into two
                difference.splice(i + 1, 0, {
                    startObj: b[j].endObj, 
                    endObj: difference[i].endObj
                });
                difference[i] = {
                    startObj: difference[i].startObj,
                    endObj: b[j].startObj
                };
                i++;
            }
        } else if (difference[i].endObj.isSameOrBefore(b[j].startObj)) {
            i++;
        } else {
            j++;
        }
    }

    // Return only non-empty intervals
    return difference.filter(interval => interval.startObj.isBefore(interval.endObj));
}

function binarySearch(intervals, dateTimeObj, startIndex, endIndex, endNotStart) {
    if (endIndex == 0)
        return 0;

    var startIndex = startIndex || 0;
    var endIndex = endIndex || Math.max(0, intervals.length - 1);

    var middleIndex = Math.floor((startIndex + endIndex) / 2);

    if (startIndex >= endIndex)
        return middleIndex;
        
    var middleInterval = endNotStart ?
    intervals[middleIndex].endObj :
    intervals[middleIndex].startObj;

    if (dateTimeObj.isSame(middleInterval))
        return middleIndex;
    else if (dateTimeObj.isBefore(middleInterval))
        return binarySearch(intervals, dateTimeObj, startIndex, middleIndex);
    else if (dateTimeObj.isAfter(middleInterval))
        return binarySearch(intervals, dateTimeObj, middleIndex + 1, endIndex);
    else
        return -1;
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