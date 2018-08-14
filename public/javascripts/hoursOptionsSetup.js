const HOURS_REQUEST_BUTTON_SELECTOR = '#hoursRequestButton';

const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';

let payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
let payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

let hoursRequestButton = document.querySelector(HOURS_REQUEST_BUTTON_SELECTOR);

hoursRequestButton.onclick = () => {
    var uri = '/data/hours?' +
    'payPeriodStart=' + payPeriodStartInput.value +
    '&payPeriodEnd=' + payPeriodEndInput.value;
    
    fetch(uri)
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