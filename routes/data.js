// TODO: Clean up this file by splitting functions into different files
var express = require('express');
var moment = require('moment');

var config = require('../config');

var openTimeClock = require('../lib/open-time-clock-requests');
var setmore = require('../lib/setmore-requests');

var allTutors = require('../data/tutors.json');

var router = express.Router();

router.post('/hours', async function (req, res, next) {
    var tutors = req
        .body
        .tutors
        .map((setmoreId) => allTutors.find((tutor) => tutor.setmoreId == setmoreId));
        
    const hours = await getHours(req.query.payPeriodStart, req.query.payPeriodEnd, tutors);
    res.send(hours);
});

// TODO: Separate into separate functions
async function getHours(payPeriodStart, payPeriodEnd, tutors) {
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
            .then((responses) => evaluateHoursWorked(tutor.name, payPeriodStartObj, payPeriodEndObj,
                responses[0], responses[1], responses[2])
            );
    });

    return await Promise.all(staffHoursPromises);
}

function evaluateHoursWorked(name, payPeriodStartObj, payPeriodEndObj,
    openTimeClockHours, setmoreHours, slotBlockers) {
    var openTimeClockDatesToIntervals = formattedOpenTimeClockHours(openTimeClockHours, payPeriodStartObj, payPeriodEndObj);
    var setmoreDatesToIntervals = formattedSetmoreHours(setmoreHours, payPeriodStartObj, payPeriodEndObj);

    // Add extended hours
    const extendedEntries = slotBlockers
    .filter((slotBlocker) => slotBlocker.Comments.startsWith('E -'));

    extendedEntries.forEach((entry) => {
        const durationMinutes = entry.endTime - entry.startTime;
        const startObj = moment(entry.startDate, config.setmoreResponseDateTimeFormat);
        const endObj = moment(startObj).add(durationMinutes, 'minutes');

        const interval = { startObj, endObj };
        insertInterval(setmoreDatesToIntervals, interval);         
    });
    

    // Only accept the intervals that are logged both on Setmore and OpenTimeClock
    var datesToIntervals = datesToIntervalsPopulated(payPeriodStartObj, payPeriodEndObj);
    Object
        .keys(datesToIntervals)
        .forEach((date) => {
            datesToIntervals[date] = intervalsIntersection(
                openTimeClockDatesToIntervals[date],
                intervalsSimple(setmoreDatesToIntervals[date])
            );
        });

    // Handle breaks

    // Handle time off

    // Add admin hours
    const adminEntries = slotBlockers
        .filter((slotBlocker) => slotBlocker.Comments.startsWith('A -'));

        adminEntries.forEach((entry) => {
        const durationMinutes = entry.endTime - entry.startTime;
        const startObj = moment(entry.startDate, config.setmoreResponseDateTimeFormat);
        const endObj = moment(startObj).add(durationMinutes, 'minutes');

        const interval = { startObj, endObj };
        insertInterval(setmoreDatesToIntervals, interval);                
    });
    
    // Transform intervals to hours worked
    var datesToHoursWorked = {};
    for (var date in datesToIntervals) {
        if (datesToIntervals.hasOwnProperty(date)) {
            datesToHoursWorked[date] = datesToIntervals[date]
                .reduce((hours, intervalsObj) => {
                    return hours + intervalsObj.endObj.diff(intervalsObj.startObj, 'hours', true);
                }, 0);
        }
    }

    return {
        name,
        hours: datesToHoursWorked
    };
}

// Transform OpenTimeClock data to this format:
/*
{
    'MM/DD/YYYY': [{startObj: momentObj, endObj: momentObj}, ...],
    ...
}
*/
function formattedOpenTimeClockHours(openTimeClockHours, startDateObj, endDateObj) {
   var datesToIntervals = datesToIntervalsPopulated(startDateObj, endDateObj);

   openTimeClockHours.forEach((entry) => {
       var startDateTimeObj = moment(entry.InDateTime, config.openTimeClockDateTimeFormat);
       var endDateTimeObj = moment(entry.OutDateTime, config.openTimeClockDateTimeFormat);

       const interval = {
           startObj: startDateTimeObj,
           endObj: endDateTimeObj
       };
       insertInterval(datesToIntervals, interval, true);
   });

   return datesToIntervals;
}

// Transform Setmore data to this format:
/*
{
    'MM/DD/YYYY': [{startObj: momentObj, endObj: momentObj}, ...],
    ...
}
*/
function formattedSetmoreHours(setmoreHours, startDateObj, endDateObj) {
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

    var datesToIntervals = datesToIntervalsPopulated(startDateObj, endDateObj);
    Object
        .keys(datesToIntervals)
        .forEach((date) => {
            const day = moment(date, config.dateFormat)
                .format('dddd')
                .toLowerCase();
                
            const interval = setmoreDayToHours[day];
            datesToIntervals[date].push(interval);
        });
    return datesToIntervals;
}

function mergeDatesToIntervals(a, b) {

}

// Repeatedly merges intervals until array is simplified
// Array must be sorted by startObjs
function intervalsSimple(intervals) {
    var copy = intervalsCopied(intervals);
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

function intervalsDifference(a, b) {
    var difference = intervalsCopied(a);
    var i = 0;
    var j = 0;
    while (i < difference.length && j < b.length) {
        if (areOverlapping(difference[i], b[j])) {
            if (isContained(difference[i], b[j])) {
                // Split interval into two
                difference.splice(i + 1, 0, {
                    startObj: moment(b[j].endObj), 
                    endObj: difference[i].endObj
                });
                difference[i] = {
                    startObj: difference[i].startObj,
                    endObj: moment(b[j].startObj)
                };
                i++;
                j++;
            } else {
                if (difference[i].endObj.isSameOrBefore(b[j].endObj)) {
                    difference[i] = {
                        startObj: difference[i].startObj,
                        endObj: moment(b[j].startObj)
                    };
                }
                if (difference[i].startObj.isSameOrAfter(b[j].startObj)) {
                    difference[i] = {
                        startObj: moment(b[j].endObj),
                        endObj: difference[i].endObj
                    };
                }
                j++;
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

function intervalsIntersection(a, b) {
    var intersection = intervalsCopied(a);
    var i = 0;
    var j = 0;
    while (i < intersection.length && j < b.length) {
        if (areOverlapping(intersection[i], b[j])) {
            if (isContained(intersection[i], b[j])) {
                // Split interval into two
                intersection.splice(i + 1, 0, {
                    startObj: moment(b[j].endObj), 
                    endObj: intersection[i].endObj
                });
                intersection[i] = {
                    startObj: moment(b[j].startObj),
                    endObj: moment(b[j].endObj)
                };
                i++;
                j++;
            } else {
                if (!isContained(b[j], intersection[i])) {
                    if (intersection[i].startObj.isBefore(b[j].startObj)) {
                        intersection[i] = {
                            startObj: moment(b[j].startObj),
                            endObj: intersection[i].endObj
                        };
                    } else {
                        // Split interval into two
                        intersection.splice(i + 1, 0, {
                            startObj: moment(b[j].endObj), 
                            endObj: intersection[i].endObj
                        });
                        intersection[i] = {
                            startObj: intersection[i].startObj,
                            endObj: moment(b[j].endObj)
                        };
                    }
                }
                i++;
            }
        } else if (intersection[i].endObj.isSameOrBefore(b[j].startObj)) {
            intersection.splice(i, 1);
        } else {
            j++;
        }
    }
    
    return intersection.slice(0, i);
}

function intervalsCopied(intervals) {
    return intervals.map((interval) => {
        return {
            startObj: moment(interval.startObj),
            endObj: moment(interval.endObj)
    };});
}


function insertInterval(datesToIntervals, interval) {
    var intervals = datesToIntervals[interval.startObj.format(config.dateFormat)];
    var insertIndex = findInsertIndex(intervals, interval.startObj);
    
    intervals.splice(insertIndex, 0, interval);
}

function findInsertIndex(intervals, timeObj) {
    var intervalPair = Array.from(intervals.entries())
        .find((intervalPair) => timeObj.isAfter(intervalPair[1]));

    return intervalPair ? intervalPair[0] : 0;
}

// Populate all the dates from the start to the end (inclusive) with empty interval objects
function datesToIntervalsPopulated(startDateObj, endDateObj) {
    var datesToIntervals = {};
    for (var dateObj = moment(startDateObj); dateObj.isSameOrBefore(endDateObj); dateObj.add(1, 'day')) {
        datesToIntervals[dateObj.format(config.dateFormat)] = [];
    }

    return datesToIntervals;
}

// Returns true if interval-a overlaps at all with interval b and false otherwise
function areOverlapping(a, b) {
    return a.startObj.isSameOrBefore(b.endObj) && a.endObj.isSameOrAfter(b.startObj);
}

// Returns true if interval-b is contained within interval-a
function isContained(a, b) {
    return a.startObj.isBefore(b.startObj) && a.endObj.isAfter(b.endObj);
}

module.exports = router;