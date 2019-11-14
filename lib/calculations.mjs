import moment from 'moment';
import openTimeClock from './open-time-clock-requests';
import setmore from './setmore-requests';

const {
  setmoreResponseDateTimeFormat,
  openTimeClockDateTimeFormat,
  dateFormat,
  setmoreTimeFormat,
  setmoreExtendedHoursRegex,
  setmoreAdminHoursRegex
} = process.env;

async function getHours(payPeriodStart, payPeriodEnd, tutors) {
  const payPeriodStartObj = moment(payPeriodStart);
  const payPeriodEndObj = moment(payPeriodEnd);

  const openTimeClockHoursPromise = openTimeClock.getStaffHours(payPeriodStartObj, payPeriodEndObj);
  const setmoreHoursPromise = setmore.getStaffHours();
  const setmoreBreaksPromise = setmore.getStaffBreaks();

  const staffHoursPromises = tutors.map((tutor) => {
    const appointmentsPromise = setmore.getAppointments(tutor.setmoreId, payPeriodStartObj, payPeriodEndObj);

    return Promise.all([openTimeClockHoursPromise, setmoreHoursPromise, setmoreBreaksPromise, appointmentsPromise])
      .then(responses => [
        responses[0].filter(entry => entry.EmployeeID === tutor.openTimeClockId),
        responses[1].find(entry => entry.ResourceKey === tutor.setmoreId),
        responses[2].find(entry => entry.ResourceKey === tutor.setmoreId),
        responses[3].filter(appointment => appointment.serviceKey === 'slotBlocker')
      ])
      .then(responses => evaluateHoursWorked(
        tutor, payPeriodStartObj, payPeriodEndObj,
        responses[0], responses[1], responses[2], responses[3]
      ));
  });

  return Promise.all(staffHoursPromises);
}

function evaluateHoursWorked(
  tutor, payPeriodStartObj, payPeriodEndObj,
  openTimeClockHours, setmoreHours, setmoreBreaks, slotBlockers
) {
  const openTimeClockDatesToIntervals = formattedOpenTimeClockHours(openTimeClockHours, payPeriodStartObj, payPeriodEndObj);
  const setmoreHoursDatesToIntervals = formattedSetmoreHours(setmoreHours, payPeriodStartObj, payPeriodEndObj);
  const setmoreBreaksDatesToIntervals = formattedSetmoreHours(setmoreBreaks, payPeriodStartObj, payPeriodEndObj);


  const extendedSlotBlockers = slotBlockers
    .filter(slotBlocker => slotBlocker.Comments && slotBlocker.Comments.match(setmoreExtendedHoursRegex));
  const adminSlotBlockers = slotBlockers
    .filter(slotBlocker => slotBlocker.Comments && slotBlocker.Comments.match(setmoreAdminHoursRegex));
  const timeOffBlockers = slotBlockers
    .filter(slotBlocker => !slotBlocker.Comments || (!slotBlocker.Comments.match(setmoreExtendedHoursRegex)
      && !slotBlocker.Comments.match(setmoreAdminHoursRegex)));


  // Handle breaks
  Object
    .keys(setmoreHoursDatesToIntervals)
    .forEach((date) => {
      setmoreHoursDatesToIntervals[date] = intervalsDifference(
        setmoreHoursDatesToIntervals[date],
        setmoreBreaksDatesToIntervals[date]
      );
    });

  // Add extended entries
  extendedSlotBlockers.forEach((slotBlocker) => {
    const interval = intervalFromSlotBlocker(slotBlocker);
    addInterval(setmoreHoursDatesToIntervals, interval);

    // Simplify setmore intervals by merging the newly added extended entries
    const date = interval.startObj.format(dateFormat);
    setmoreHoursDatesToIntervals[date] = intervalsSimple(setmoreHoursDatesToIntervals[date]);
  });

  // Handle time off
  timeOffBlockers
    .forEach((slotBlocker) => {
      const interval = intervalFromSlotBlocker(slotBlocker);
      subtractInterval(setmoreHoursDatesToIntervals, interval);
    });

  // Only accept the intervals that are logged both on Setmore and OpenTimeClock
  const datesToIntervals = datesToIntervalsPopulated(payPeriodStartObj, payPeriodEndObj);
  Object
    .keys(datesToIntervals)
    .forEach((date) => {
      const dateObj = moment(date, dateFormat);

      // If date is not before today, take setmore because people couldn't clock in yet
      datesToIntervals[date] = dateObj.isBefore(moment().startOf('day'))
        ? intervalsIntersection(
          openTimeClockDatesToIntervals[date],
          setmoreHoursDatesToIntervals[date]
        ) : setmoreHoursDatesToIntervals[date];
    });

  // Add admin hours
  adminSlotBlockers.forEach((slotBlocker) => {
    const interval = intervalFromSlotBlocker(slotBlocker);
    addInterval(datesToIntervals, interval);
  });

  // Transform intervals to hours worked
  const datesToHoursWorked = {};
  Object
    .keys(datesToIntervals)
    .forEach((date) => {
      datesToHoursWorked[date] = datesToIntervals[date]
        .reduce((hours, intervalsObj) => hours + intervalsObj.endObj.diff(intervalsObj.startObj, 'hours', true), 0);
    });

  return {
    ...tutor,
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
  const datesToIntervals = datesToIntervalsPopulated(startDateObj, endDateObj);

  openTimeClockHours.forEach((entry) => {
    const startDateTimeObj = moment(entry.InDateTime, openTimeClockDateTimeFormat);

    // If clock out is missing, assume they clocked out now
    let endDateTimeObj = moment(entry.OutDateTime, openTimeClockDateTimeFormat);
    if (!endDateTimeObj.isValid() || endDateTimeObj.year() <= 0) { endDateTimeObj = moment(); }

    const interval = {
      startObj: startDateTimeObj,
      endObj: endDateTimeObj
    };

    addInterval(datesToIntervals, interval);
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
  const setmoreDayToHours = {
    sunday: setmoreHours.WorkingDays.includes('0') ? setmoreHours.su : '',
    monday: setmoreHours.WorkingDays.includes('1') ? setmoreHours.mo : '',
    tuesday: setmoreHours.WorkingDays.includes('2') ? setmoreHours.tu : '',
    wednesday: setmoreHours.WorkingDays.includes('3') ? setmoreHours.we : '',
    thursday: setmoreHours.WorkingDays.includes('4') ? setmoreHours.th : '',
    friday: setmoreHours.WorkingDays.includes('5') ? setmoreHours.fr : '',
    saturday: setmoreHours.WorkingDays.includes('6') ? setmoreHours.sa : ''
  };
  Object
    .keys(setmoreDayToHours)
    .forEach((day) => {
      if (!day) return;

      const hours = [];
      const dataSplit = setmoreDayToHours[day].split(',');
      for (let i = 1; i < dataSplit.length; i += 4) {
        hours.push({
          start: dataSplit[i],
          end: dataSplit[i + 2]
        });
      }

      setmoreDayToHours[day] = hours;
    });

  const datesToIntervals = datesToIntervalsPopulated(startDateObj, endDateObj);
  Object
    .keys(datesToIntervals)
    .forEach((date) => {
      const day = moment(date, dateFormat)
        .format('dddd')
        .toLowerCase();

      setmoreDayToHours[day].forEach((interval) => {
        const momentInterval = {
          startObj: moment(
            `${date} ${interval.start}`,
            `${dateFormat} ${setmoreTimeFormat}`
          ),
          endObj: moment(
            `${date} ${interval.end}`,
            `${dateFormat} ${setmoreTimeFormat}`
          )
        };

        datesToIntervals[date].push(momentInterval);
      });
    });
  return datesToIntervals;
}

// Repeatedly merges intervals until array is simplified
// Array must be sorted by startObjs
function intervalsSimple(intervals) {
  const copy = intervalsCopied(intervals);
  for (let i = 0; i < copy.length - 1; i++) {
    if (copy[i + 1].startObj.isSameOrBefore(copy[i].endObj)) {
      // Merge the two intervals
      copy[i].endObj = moment.max(copy[i].endObj, copy[i + 1].endObj);
      copy.splice(i + 1, 1);
      i--;
    }
  }
  return copy.filter(interval => interval.startObj.isBefore(interval.endObj));
}

function intervalsDifference(a, b) {
  const difference = intervalsCopied(a);
  let i = 0;
  let j = 0;
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
        if (difference[i].startObj.isSameOrAfter(b[j].startObj)) {
          difference[i] = {
            startObj: moment(b[j].endObj),
            endObj: difference[i].endObj
          };
        }
        if (difference[i].endObj.isSameOrBefore(b[j].endObj)) {
          difference[i] = {
            startObj: difference[i].startObj,
            endObj: moment(b[j].startObj)
          };
          i++;
        } else {
          j++;
        }
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
  const intersection = intervalsCopied(a);
  let i = 0;
  let j = 0;
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
  return intervals.map(interval => ({
    startObj: moment(interval.startObj),
    endObj: moment(interval.endObj)
  }));
}


function addInterval(datesToIntervals, interval) {
  const intervals = datesToIntervals[interval.startObj.format(dateFormat)];
  if (intervals === undefined) {
    console.error(`intervals not found while adding interval ${JSON.stringify(interval)}`);
    return;
  }

  const insertIndex = findInsertIndex(intervals, interval.startObj);

  intervals.splice(insertIndex, 0, interval);

  datesToIntervals[interval.startObj.format(dateFormat)] = intervalsSimple(intervals);
}

function subtractInterval(datesToIntervals, interval) {
  const intervals = datesToIntervals[interval.startObj.format(dateFormat)];
  if (intervals === undefined) {
    console.error(`intervals not found while subtracting interval ${JSON.stringify(interval)}`);
    return;
  }

  datesToIntervals[interval.startObj.format(dateFormat)] = intervalsDifference(
    intervals,
    [interval]
  );
}

function findInsertIndex(intervals, timeObj) {
  const indexIntervalPair = Array.from(intervals.entries())
    .find(pair => timeObj.isSameOrBefore(pair[1].startObj));

  return indexIntervalPair ? indexIntervalPair[0] : intervals.length;
}

// Populate all the dates from the start to the end (inclusive) with empty interval objects
function datesToIntervalsPopulated(startDateObj, endDateObj) {
  const datesToIntervals = {};
  for (const dateObj = moment(startDateObj); dateObj.isSameOrBefore(endDateObj); dateObj.add(1, 'day')) {
    datesToIntervals[dateObj.format(dateFormat)] = [];
  }

  return datesToIntervals;
}

// Returns true if interval-a overlaps at all with interval b and false otherwise
function areOverlapping(a, b) {
  return a.startObj.isBefore(b.endObj) && a.endObj.isAfter(b.startObj);
}

// Returns true if interval-b is contained within interval-a
function isContained(a, b) {
  return a.startObj.isBefore(b.startObj) && a.endObj.isAfter(b.endObj);
}

// Creates an interval from a slot blocker
function intervalFromSlotBlocker(slotBlocker) {
  const durationMinutes = slotBlocker.endTime - slotBlocker.startTime;
  const startObj = moment(slotBlocker.startDate, setmoreResponseDateTimeFormat);
  const endObj = moment(startObj).add(durationMinutes, 'minutes');

  return {
    startObj,
    endObj
  };
}

export default {
  getHours
};
