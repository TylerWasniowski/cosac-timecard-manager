const PAY_PERIOD_START_INPUT_SELECTOR = '#payPeriodStartInput';
const PAY_PERIOD_END_INPUT_SELECTOR = '#payPeriodEndInput';

const HOURS_FILE_BUTTON_SELECTOR = '#hoursFileButton';
const UPDATE_TUTORS_BUTTON_SELECTOR = '#updateTutorsButton';


let payPeriodStartInput = document.querySelector(PAY_PERIOD_START_INPUT_SELECTOR);
let payPeriodEndInput = document.querySelector(PAY_PERIOD_END_INPUT_SELECTOR);

let hoursFileButton = document.querySelector(HOURS_FILE_BUTTON_SELECTOR);
let updateTutorsButton = document.querySelector(UPDATE_TUTORS_BUTTON_SELECTOR);


hoursFileButton.onclick = () => {
    var uri = '/data/hours?' +
    'payPeriodStart=' + payPeriodStartInput.value +
    '&payPeriodEnd=' + payPeriodEndInput.value;
    
    fetch(uri)
        .then((res) => res.json())
        .then((res) => res
            .map((entry) => {
                var hoursString = Object
                    .keys(entry.hours)
                    .map((day) => day + ': ' + entry.hours[day])
                    .join('\n');

                return entry.name + '\n' + hoursString;
            })
            .join('\n\n')
        )
        .then((res) => download('hours.txt', res));
    return false;
};

updateTutorsButton.onclick = () => {
    fetch('/tutors/update', {method: 'POST'})
        .then((res) => res.json())
        .then((res) => download('tutors.json', JSON.stringify(res)));

    return false;
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