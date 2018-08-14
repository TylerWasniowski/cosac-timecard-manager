const OPTIONS_CONTAINER_CLASS_NAME = 'optionsContainer';
const OPTIONS_CLASS_NAME = 'options';
const EXIT_BUTTON_CLASS_NAME = 'exitButton';

const HOURS_FILE_BUTTON_SELECTOR = '#hoursFileButton';
const SLOT_BLOCKERS_BUTTON_SELECTOR = '#slotBlockersButton';
const UPDATE_TUTORS_BUTTON_SELECTOR = '#updateTutorsButton';


const hoursFileButton = document.querySelector(HOURS_FILE_BUTTON_SELECTOR);
const slotBlockersButton = document.querySelector(SLOT_BLOCKERS_BUTTON_SELECTOR);
const updateTutorsButton = document.querySelector(UPDATE_TUTORS_BUTTON_SELECTOR);

hoursFileButton.onclick = () => {
    fetch('/options/hours')
        .then((res) => res.text())
        .then(renderOptions);
}

slotBlockersButton.onclick = () => {
    fetch('/options/blockers')
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

    let optionsDiv = document.createElement('div');
    optionsDiv.className = OPTIONS_CLASS_NAME;

    let exitButton = document.createElement('span');
    exitButton.className = EXIT_BUTTON_CLASS_NAME;
    exitButton.innerText = 'X';
    exitButton.onclick = () => {
        document.body.removeChild(optionsContainer)
    };
    
    optionsDiv.innerHTML = html;
    optionsDiv.prepend(exitButton);

    optionsContainer.appendChild(optionsDiv);
    document.body.appendChild(optionsContainer);

    optionsDiv.querySelectorAll('script')
        .forEach((script) => {
            optionsDiv.removeChild(script);

            let newScript = document.createElement('script');
            newScript.src = script.src;
            optionsDiv.appendChild(newScript);
        });
}