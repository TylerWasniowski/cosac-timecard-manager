const OPTIONS_CONTAINER_CLASS_NAME = 'optionsContainer';
const OPTIONS_CLASS_NAME = 'options';
const EXIT_BUTTON_CLASS_NAME = 'exitButton';

const HOURS_FILE_BUTTON_SELECTOR = '#hoursFileButton';
const UPDATE_TUTORS_BUTTON_SELECTOR = '#updateTutorsButton';


let hoursRequestButton = document.querySelector(HOURS_FILE_BUTTON_SELECTOR);
let updateTutorsButton = document.querySelector(UPDATE_TUTORS_BUTTON_SELECTOR);

hoursRequestButton.onclick = () => {
    fetch('/options/hours')
        .then((res) => res.text())
        .then(renderOptions);
}


updateTutorsButton.onclick = () => {
    fetch('/tutors/update', {method: 'POST'})
        .then((res) => res.json());
}

function renderOptions(html) {
    let optionsContainer = document.createElement('div');
    optionsContainer.className = OPTIONS_CONTAINER_CLASS_NAME;

    let hoursOptionsDiv = document.createElement('div');
    hoursOptionsDiv.className = OPTIONS_CLASS_NAME;

    let exitButton = document.createElement('span');
    exitButton.className = EXIT_BUTTON_CLASS_NAME;
    exitButton.innerText = 'X';
    exitButton.onclick = () => {
        document.body.removeChild(optionsContainer)
    };
    
    hoursOptionsDiv.innerHTML = html;
    hoursOptionsDiv.prepend(exitButton);

    optionsContainer.appendChild(hoursOptionsDiv);
    document.body.appendChild(optionsContainer);
}