(() => {
  const REQUEST_HOURS_BUTTON_SELECTOR = '#requestHoursButton';
  const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
  const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';
  const TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';

  const payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
  const payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

  const requestHoursButton = document.querySelector(REQUEST_HOURS_BUTTON_SELECTOR);

  requestHoursButton.onclick = () => {
    const uri = `/data/hours?payPeriodStart=${payPeriodStartInput.value}&payPeriodEnd=${payPeriodEndInput.value}`;

    const filename = `${payPeriodStartInput.value} - ${payPeriodEndInput.value}.txt`;
    fetch(uri, {
      method: 'POST',
      body: JSON.stringify({
        tutors: getCheckedTutors()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => res
        .map((entry) => {
          // Round hours to nearest 0.5
          const hoursRounded = {};
          Object
            .keys(entry.hours)
            .forEach((date) => {
              hoursRounded[date] = (Math.round(entry.hours[date] * 2) / 2);
            });
          const totalHours = Object
            .keys(hoursRounded)
            .reduce((hours, date) => hours + hoursRounded[date], 0);
          const hoursString = `${Object
            .keys(hoursRounded)
            .map(date => `${date}: ${hoursRounded[date]}`)
            .join('\n')}\nTotal Hours: ${totalHours}`;

          return `${entry.name}\n${hoursString}`;
        })
        .join('\n\n'))
      .then(res => download(filename, res));

    return false;
  };

  function getCheckedTutors() {
    return Array.from(document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR))
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.id);
  }

  // Taken from: https://stackoverflow.com/a/18197341
  function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
})();
