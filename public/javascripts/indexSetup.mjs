import download from './download.mjs';


const OPTIONS_CONTAINER_CLASS_NAME = 'optionsContainer';
const OPTIONS_CLASS_NAME = 'options';
const EXIT_BUTTON_CLASS_NAME = 'exitButton';

const HOURS_FILE_BUTTON_SELECTOR = '#hoursFileButton';
const SLOT_BLOCKERS_BUTTON_SELECTOR = '#slotBlockersButton';
const UPDATE_TUTORS_BUTTON_SELECTOR = '#updateTutorsButton';
const TUTORS_LIST_BUTTON_SELECTOR = '#tutorsListButton';


const hoursFileButton = document.querySelector(HOURS_FILE_BUTTON_SELECTOR);
const slotBlockersButton = document.querySelector(SLOT_BLOCKERS_BUTTON_SELECTOR);
const updateTutorsButton = document.querySelector(UPDATE_TUTORS_BUTTON_SELECTOR);
const tutorsListButton = document.querySelector(TUTORS_LIST_BUTTON_SELECTOR);

hoursFileButton.onclick = () => {
  fetch('/options/hours')
    .then(res => res.text())
    .then(renderOptions)
    .catch(alert);
};

slotBlockersButton.onclick = () => {
  fetch('/options/blockers')
    .then(res => res.text())
    .then(renderOptions)
    .catch(alert);
};

updateTutorsButton.onclick = () => {
  fetch('/tutors/update', { method: 'POST' })
    .then(res => res.json())
    .catch(alert);
};

tutorsListButton.onclick = () => {
  fetch('/tutors/list', { method: 'GET' })
    .then(res => res.json())
    .then(tutors => tutors.map(tutor => (
      `${tutor.name}\n` +
      `Classes: ${tutor.services.join(', ')}`
    )))
    .then(tutors => tutors.join('\n\n'))
    .then(tutors => download('tutors list - 10-18-2018.txt', tutors))
    .catch(alert);
};

function renderOptions(html) {
  const optionsContainer = document.createElement('div');
  optionsContainer.className = OPTIONS_CONTAINER_CLASS_NAME;

  const optionsDiv = document.createElement('div');
  optionsDiv.className = OPTIONS_CLASS_NAME;

  const exitButton = document.createElement('span');
  exitButton.className = EXIT_BUTTON_CLASS_NAME;
  exitButton.innerText = 'X';
  exitButton.onclick = () => {
    document.body.removeChild(optionsContainer);
  };

  optionsDiv.innerHTML = html;
  optionsDiv.prepend(exitButton);

  optionsContainer.appendChild(optionsDiv);
  document.body.appendChild(optionsContainer);

  optionsDiv.querySelectorAll('script')
    .forEach((script) => {
      optionsDiv.removeChild(script);

      const newScript = document.createElement('script');
      newScript.src = script.src;
      newScript.type = 'module';
      optionsDiv.appendChild(newScript);
    });
}
