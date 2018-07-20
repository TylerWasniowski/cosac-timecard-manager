const HOURS_FILE_BUTTON_SELECTOR = '#hoursFileButton';

// Function taken from: https://stackoverflow.com/a/18197341
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

let hoursFileButton = document.querySelector(HOURS_FILE_BUTTON_SELECTOR);

hoursFileButton.onclick = () => {
    fetch('/data/hours')
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