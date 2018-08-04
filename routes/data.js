// TODO: Clean up this file by splitting functions into different files
var express = require('express');
var moment = require('moment');

var config = require('../config');

var openTimeClock = require('../lib/open-time-clock-requests');
var setmore = require('../lib/setmore-requests');

var tutors = require('../data/tutors.json');

var router = express.Router();

var tutorsDone = 0;
router.get('/hours', async function (req, res, next) {
    const hours = await getHours(req.query.payPeriodStart, req.query.payPeriodEnd);
    tutorsDone = 0;
    res.send(hours);
});

// TODO: Separate into separate functions
async function getHours(payPeriodStart, payPeriodEnd) {
    const payPeriodStartObj = moment(payPeriodStart);
    const payPeriodEndObj = moment(payPeriodEnd);

    const openTimeClockHoursPromise = openTimeClock.getStaffHours(payPeriodStartObj, payPeriodEndObj);
    const setmoreHoursPromise = setmore.getStaffHours();

    let staffHoursPromises = tutors.map((tutor) => {
        const appointmentsPromise = setmore.getAppointments(tutor.setmoreId, payPeriodStartObj, payPeriodEndObj);

        return Promise.all([openTimeClockHoursPromise, setmoreHoursPromise, appointmentsPromise])
            .then((responses) => [
                responses[0].filter((entry) => entry.EmployeeID == tutor.openTimeClockId),
                responses[1].find((entry) => entry.ResourceKey == tutor.setmoreId),     
                responses[2].filter((appointment) => appointment.serviceKey == 'slotBlocker')
            ])
            .then((responses) => evaluateHoursWorked(tutor, payPeriodStartObj, payPeriodEndObj,
                responses[0], responses[1], responses[2])
            );
    });

    return await Promise.all(staffHoursPromises);
}

function evaluateHoursWorked(tutor, payPeriodStartObj, payPeriodEndObj,
    openTimeClockHours, setmoreHours, slotBlockers) {
    console.log(tutor.name);
    console.log(++tutorsDone + '/' + tutors.length);
    if (!setmoreHours) {
        return {
            name: tutor.name + ': ' + 'Setmore Error',
            hours: {}
        }
    }

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
        datesToIntervals[dateObj.format(config.dateFormat)] = {
            onIntervals: [],
            offIntervals: []
        };
    }
    openTimeClockHours.forEach((entry) => {
        var startDateTimeObj = moment(entry.InDateTime, config.openTimeClockDateTimeFormat);
        var endDateTimeObj = moment(entry.OutDateTime, config.openTimeClockDateTimeFormat);

        // console.log(entry.InDateTime);
        // console.log(startDateTimeObj.format(config.dateFormat));
        // console.log(datesToIntervals);
        // Object.keys(datesToIntervals)
        //     .forEach(x => console.log(x + '| ' + x == startDateTimeObj.format(config.dateFormat)));
        // console.log(Object.keys(datesToIntervals));
        // console.log('test');

        var intervalsObj = datesToIntervals[startDateTimeObj.format(config.dateFormat)];

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
    var setmoreDayToHours = {
        sunday: setmoreHours.su,
        monday: setmoreHours.mo,
        tuesday: setmoreHours.tu,
        wednesday: setmoreHours.we,
        thursday: setmoreHours.th,
        friday: setmoreHours.fr,
        saturday: setmoreHours.sa
    };
    Object
        .keys(setmoreDayToHours)
        .forEach((day) => {
            var dataSplit = setmoreDayToHours[day].split(',');
            setmoreDayToHours[day] = {
                startObj: moment(dataSplit[1], config.setmoreTimeFormat),
                endObj: moment(dataSplit[3], config.setmoreTimeFormat)
            };
        });

    // Disregard time clocked in but not open on Setmore
    for (var date in datesToIntervals) {
        if (datesToIntervals.hasOwnProperty(date)) {
            var dateObj = moment(date, config.dateFormat);
            var day = dateObj
                .format('dddd')
                .toLowerCase();
            var dayHoursData = setmoreDayToHours[day];
            
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

    // Handle breaks

    // Handle time off


    // Add extended hours
    const extendedEntries = slotBlockers.filter((slotBlocker) => slotBlocker.comments.startsWith('E -'));
    extendedEntries.forEach((entry) => {
        const durationMinutes = entry.endTime - entry.startTime;

        const interval = {
            startObj
        }
    })

    // Add admin hours
    const adminEntries = slotBlockers.filter((slotBlocker) => slotBlocker.comments.startsWith('A -'));

    
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