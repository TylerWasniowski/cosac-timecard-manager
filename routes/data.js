// TODO: Clean up this file by splitting functions into different files
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:SS';
const OPENTIMECLOCK_DATE_FORMAT = 'MM/DD/YYYY';
const OPENTIMECLOCK_DATE_SEPARATOR = ' - ';
const OPENTIMECLOCK_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:SS';
const SETMORE_TIME_FORMAT = 'HH:mm A';

var express = require('express');
var moment = require('moment');

var timeClock = require('../lib/opentimeclock-requests');
var setmore = require('../lib/setmore-requests');

var tutors = require('../data/tutors.json');

var router = express.Router();

router.get('/hours', async function (req, res, next) {
    var hours = await getHours(req.query.payPeriodStart, req.query.payPeriodEnd);
    res.send(hours);
});

// TODO: Separate into separate functions
async function getHours(payPeriodStart, payPeriodEnd) {
    var payPeriodStartObj = moment(payPeriodStart);
    var payPeriodEndObj = moment(payPeriodEnd);

    var timeClockDateRange =
        payPeriodStartObj.format(OPENTIMECLOCK_DATE_FORMAT) +
        OPENTIMECLOCK_DATE_SEPARATOR +
        payPeriodEndObj.format(OPENTIMECLOCK_DATE_FORMAT);

    var timeClockHoursResponse = timeClock.getStaffHours(timeClockDateRange);
    var setmoreHoursResponse = setmore.getStaffHours();

    var timeClockHours = await timeClockHoursResponse;
    var setmoreHours = await setmoreHoursResponse;

    var staffHours = tutors.map((tutor) => {
        var timeClockEntries = timeClockHours.filter((entry) => tutor.timeClockId == entry.EmployeeID);
        var setmoreData = setmoreHours.find((entry) => tutor.setmoreId == entry.ResourceKey);        

        // Transform OpenTimeClock data to this format:
        /*
        {
            'xxxxxxx': {
                'MM/DD/YYYY': {
                    onIntervals: [{startObj: momentObj, endObj: momentObj}, ...]
                    offIntervals: [{startObj: momentObj, endObj: momentObj}, ...]
                },
                ...
            },
            ...
        }
        */
       var datesToIntervals = {};
       // Populate all the dates from the start to the end (inclusive) with empty interval objects
        for (var dateObj = moment(payPeriodStartObj); dateObj.isSameOrBefore(payPeriodEndObj); dateObj.add(1, 'd')) {
            datesToIntervals[dateObj.format(DATE_FORMAT)] = {
                onIntervals: [],
                offIntervals: []
            };
        }
        timeClockEntries.forEach((entry) => {
            var startDateTimeObj = moment(entry.InDateTime, OPENTIMECLOCK_DATE_TIME_FORMAT);
            var endDateTimeObj = moment(entry.OutDateTime, OPENTIMECLOCK_DATE_TIME_FORMAT);

            // console.log(entry.InDateTime);
            // console.log(startDateTimeObj.format(DATE_FORMAT));
            // console.log(datesToIntervals);
            // Object.keys(datesToIntervals)
            //     .forEach(x => console.log(x + '| ' + x == startDateTimeObj.format(DATE_FORMAT)));
            // console.log(Object.keys(datesToIntervals));
            // console.log('test');

            var intervalsObj = datesToIntervals[startDateTimeObj.format(DATE_FORMAT)];

            var intervalPair = Array.from(intervalsObj.onIntervals.entries())
                .find((intervalPair) => startDateTimeObj.isAfter(intervalPair[1]));
            var insertIndex = intervalPair ? intervalPair[0] : 0;

            var intervalObj = {
                startObj: startDateTimeObj,
                endObj: endDateTimeObj
            };
            intervalsObj.onIntervals.splice(insertIndex, 0, intervalObj);
        });

        // Transform Setmore data to this format:
        /*
        {
            sunday: {startObj: momentObj, endObj: momentObj},
            ...,
            saturday: {startObj: momentObj, endObj, momentObj}
        }
        */
        var dayToHoursData = {
            sunday: setmoreData.su,
            monday: setmoreData.mo,
            tuesday: setmoreData.tu,
            wednesday: setmoreData.we,
            thursday: setmoreData.th,
            friday: setmoreData.fr,
            saturday: setmoreData.sa
        };
        Object
            .keys(dayToHoursData)
            .forEach((day) => {
                var dataSplit = dayToHoursData[day].split(',');
                dayToHoursData[day] = {
                    startObj: moment(dataSplit[1], SETMORE_TIME_FORMAT),
                    endObj: moment(dataSplit[3], SETMORE_TIME_FORMAT)
                };
            });

        // Disregard time clocked in but not open on Setmore
        for (var date in datesToIntervals) {
            if (datesToIntervals.hasOwnProperty(date)) {
                var dateObj = moment(date, DATE_FORMAT);
                var day = dateObj
                    .format('dddd')
                    .toLowerCase();
                var dayHoursData = dayToHoursData[day];
                
                if (datesToIntervals[date].onIntervals.length > 0) {
                    var firstInterval = datesToIntervals[date].onIntervals[0];
                    var lastInterval = datesToIntervals[date].onIntervals[
                        datesToIntervals[date].onIntervals.length - 1
                    ];

                    var setmoreStartObj = moment(firstInterval.startObj)
                        .hours(dayHoursData.startObj.hours())
                        .minutes(dayHoursData.startObj.minutes());
                    var setmoreEndObj = moment(firstInterval.endObj)
                        .hours(dayHoursData.endObj.hours())
                        .minutes(dayHoursData.endObj.minutes());
                    firstInterval.startObj = moment.max(setmoreStartObj, firstInterval.startObj);
                    lastInterval.endObj = moment.min(setmoreEndObj, lastInterval.endObj);        
                }
                datesToIntervals[date].onIntervals = simplifiedIntervals(datesToIntervals[date].onIntervals);
            }
        }
        
        // Transform intervals to hours worked
        var datesToHoursWorked = {};
        for (var date in datesToIntervals) {
            if (datesToIntervals.hasOwnProperty(date)) {
                datesToHoursWorked[date] = datesToIntervals[date]
                    .onIntervals.reduce((hours, intervalsObj) => {
                        return hours + intervalsObj.endObj.diff(intervalsObj.startObj, 'h', true);
                    }, 0);
            }
        }
        
        return {
            name: tutor.name,
            hours: datesToHoursWorked
        };
    });

    return staffHours;
}

// Repeatedly merges intervals until array is simplified
// Array must be sorted by startObjs
function simplifiedIntervals(intervals) {
    var copy = intervals.map(interval => {
        return {
            startObj: moment(interval.startObj),
            endObj: moment(interval.endObj)
    };});
    for (var i = 0; i < copy.length - 1; i++) {
        if (copy[i + 1].startObj.isSameOrBefore(copy[i].endObj)) {
            // Merge the two intervals
            copy[i].endObj = moment.max(copy[i].endObj, copy[i + 1].endObj);
            copy.splice(i + 1, 1);
            i--;
        }
    }
    return copy.filter((interval) => interval.startObj.isBefore(interval.endObj));
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

module.exports = router;