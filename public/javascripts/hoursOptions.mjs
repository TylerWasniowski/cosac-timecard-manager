import emailOptions from './emailOptions.mjs';
import download from './download.mjs';


function setup() {
  const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
  const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';

  const TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';

  const REQUEST_HOURS_BUTTON_SELECTOR = '#requestHoursButton';
  const SEND_EMAILS_BUTTON_SELECTOR = '#sendEmailsButton';


  const payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
  const payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

  const tutorsCheckbox = document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR);

  const requestHoursButton = document.querySelector(REQUEST_HOURS_BUTTON_SELECTOR);
  const sendEmailsButton = document.querySelector(SEND_EMAILS_BUTTON_SELECTOR);


  requestHoursButton.onclick = (event) => {
    const filename = `${payPeriodStartInput.value} - ${payPeriodEndInput.value}.txt`;

    fetchTutors(getCheckedTutors(), payPeriodStartInput.value, payPeriodEndInput.value)
      .then(tutors => tutors.map(tutor => `${tutor.name}\n${tutor.hours}`))
      .then(hours => hours.join('\n\n'))
      .then(res => download(filename, res))
      .catch(alert);
  };

  sendEmailsButton.onclick = () => {
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
      .then(tutorsInfo => tutorsInfo.map(tutor => ({
        ...tutor,
        hours: formatHours(tutor.hours)
      })))
  );
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

export default {
  setup
};
