(() => {
    const REQUEST_HOURS_BUTTON_SELECTOR = '#requestHoursButton';
    const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
    const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';
    const TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';

    const payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
    const payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

    const requestHoursButton = document.querySelector(REQUEST_HOURS_BUTTON_SELECTOR);

    requestHoursButton.onclick = () => {
        var uri = '/data/hours?' +
        'payPeriodStart=' + payPeriodStartInput.value +
        '&payPeriodEnd=' + payPeriodEndInput.value;
        
        fetch(uri, {
            method: 'POST',
            body: JSON.stringify({
                tutors: getCheckedTutors()
            }),
            headers:{
                'Content-Type': 'application/json'
            }
        })
            .then((res) => res.json())
            .then((res) => res
                .map((entry) => {
                    var hoursString = Object
                        .keys(entry.hours)
                        // Round hours to nearest 0.5
                        .map((day) => day + ': ' + (Math.round(entry.hours[day] * 2) / 2))
                        .join('\n');

                    return entry.name + '\n' + hoursString;
                })
                .join('\n\n')
            )
            .then((res) => download('hours.txt', res));

        return false;
    };

    function getCheckedTutors() {
        return Array.from(document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR))
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.id);
    }

    // Taken from: https://stackoverflow.com/a/18197341
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
})();