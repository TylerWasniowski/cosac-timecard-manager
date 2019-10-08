import emailOptions from './emailOptions.mjs';
import { download } from './helperFunctions.mjs';


function setup() {
  const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
  const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';

  const TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';

  const DOWNLOAD_FILE_BUTTON_SELECTOR = '#downloadFileButton';
  const PREVIEW_EMAILS_BUTTON_SELECTOR = '#previewEmailsButton';


  const payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
  const payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

  const tutorsCheckbox = document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR);

  const downloadFileButton = document.querySelector(DOWNLOAD_FILE_BUTTON_SELECTOR);
  const previewEmailsButton = document.querySelector(PREVIEW_EMAILS_BUTTON_SELECTOR);


  downloadFileButton.onclick = (event) => {
    const filename = `${payPeriodStartInput.value} - ${payPeriodEndInput.value}.txt`;

    fetchTutors(getCheckedTutors(), payPeriodStartInput.value, payPeriodEndInput.value)
      .then(tutors => tutors.map(tutor => `${tutor.name}\n${tutor.hours}`))
      .then(hours => hours.join('\n\n'))
      .then(res => download(filename, res))
      .catch(alert);
  };

  previewEmailsButton.onclick = () => {
    emailOptions.setup(
      fetchTutors(getCheckedTutors(), payPeriodStartInput.value, payPeriodEndInput.value)
    );
  };

  function getCheckedTutors() {
    return Array.from(tutorsCheckbox)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.id);
  }
}

function fetchTutors(tutors, startDate, endDate) {
  const uri = `/data/hours?payPeriodStart=${startDate}&payPeriodEnd=${endDate}`;

  return (
    fetch(uri, {
      method: 'POST',
      body: JSON.stringify({ tutors }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status !== 200) alert('Getting hours failed. Please try again.');
        return res;
      })
      .then(res => res.json())
      .then((tutorsInfo) => {
        tutorsInfo.forEach(checkWeekends);
        tutorsInfo.forEach(checkWeeklyHours);
        tutorsInfo.forEach(checkMonthlyHours);

        return tutorsInfo;
      })
      .then(tutorsInfo => tutorsInfo.map(tutor => ({
        ...tutor,
        hours: formatHours(tutor.hours)
      })))
  );
}

// Alerts if tutor is working weekends
function checkWeekends(tutor) {
  const hours = calculateRoundedHours(tutor.hours);

  Object
    .keys(hours)
    .forEach((date) => {
      const dateObj = makeDateObj(date);
      if (isWeekend(dateObj) && hours[date] > 0) {
        alert(`${tutor.name} is working on a weekend (${date})`);
      }
    });
}

// Alerts if tutor is working more than 20 hours a week
function checkWeeklyHours(tutor) {
  const hours = calculateRoundedHours(tutor.hours);

  let hoursWorkedCurrentWeek = 0;

  Object
    .keys(hours)
    .forEach((date) => {
      const dateObj = makeDateObj(date);
      if (dateObj.getDay() === 0) {
        if (hoursWorkedCurrentWeek > 20) {
          const lastWeekDateObj = new Date(dateObj);
          lastWeekDateObj.setDate(dateObj.getDate() - 7);

          const rangeStr = `${lastWeekDateObj.toDateString()}-${dateObj.toDateString()}`;
          alert(`${tutor.name} is working more than 20 hours a week (${hoursWorkedCurrentWeek} hours during ${rangeStr})`);
        }
        hoursWorkedCurrentWeek = 0;
      }

      hoursWorkedCurrentWeek += hours[date];
    });
}

// Alerts if tutor is working more than 80 hours in the pay period
function checkMonthlyHours(tutor) {
  const hours = calculateRoundedHours(tutor.hours);

  const totalHours = Object
    .keys(hours)
    .map(date => hours[date])
    .reduce((total, current) => total + current, 0);

  if (totalHours > 80) {
    alert(`${tutor.name} is working more than 80 hours this pay period (${totalHours} total)`);
  }
}

function formatHours(hours) {
  // Round hours to nearest 0.5
  const hoursRounded = {};
  Object
    .keys(hours)
    .forEach((date) => {
      hoursRounded[date] = (Math.round(hours[date] * 2) / 2);
    });
  const totalHours = Object
    .keys(hoursRounded)
    .reduce((acc, date) => acc + hoursRounded[date], 0);
  const hoursString = `${
    Object
      .keys(hoursRounded)
      .map(date => `${date}: ${hoursRounded[date]}`)
      .join('\n')
  }\nTotal Hours: ${totalHours}`;

  return hoursString;
}

function isWeekend(dateObj) {
  return dateObj.getDay() === 6 || dateObj.getDay() === 0;
}

// Round hours to nearest 0.5, returns them
function calculateRoundedHours(hours) {
  const hoursRounded = {};
  Object
    .keys(hours)
    .forEach((date) => {
      hoursRounded[date] = (Math.round(hours[date] * 2) / 2);
    });

  return hoursRounded;
}

function makeDateObj(date) {
  return new Date(`${date} 00:00`);
}

export default {
  setup
};
