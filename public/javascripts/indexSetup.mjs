import blockersOptions from './blockersOptions.mjs';
import cancellationsOptions from './cancellationsOptions.mjs';
import historyOptions from './historyOptions.mjs';
import hoursOptions from './hoursOptions.mjs';
import settings from './settings.mjs';

import { download, formatDate } from './helperFunctions.mjs';


const OPTIONS_OUTER_CONTAINER_CLASS_NAME = 'optionsOuterContainer';
const OPTIONS_INNER_CONTAINER_CLASS_NAME = 'optionsInnerContainer';
const OPTIONS_CLASS_NAME = 'options';
const EXIT_BUTTON_CLASS_NAME = 'exitButton';

const HOURS_WORKED_REPORT_BUTTON_SELECTOR = '#hoursWorkedReportButton';
const CREATE_SETMORE_SLOT_BLOCKERS_BUTTON_SELECTOR = '#createSetmoreSlotBlockersButton';
const UPDATE_TUTORS_BUTTON_SELECTOR = '#updateTutorsButton';
const DOWNLOAD_TUTORS_COURSES_LIST_BUTTON_SELECTOR = '#downloadTutorCoursesListButton';
const DOWNLOAD_TUTOR_HISTORY_BUTTON_SELECTOR = '#downloadTutorHistoryButton';

const CANCELLATION_REPORT_BUTTON_SELECTOR = '#cancellationReportButton';

const SETTINGS_BUTTON_SELECTOR = '#settingsButton';


const hoursWorkedReportButton = document.querySelector(HOURS_WORKED_REPORT_BUTTON_SELECTOR);
const createSetmoreSlotBlockersButton = document.querySelector(CREATE_SETMORE_SLOT_BLOCKERS_BUTTON_SELECTOR);
const updateTutorsButton = document.querySelector(UPDATE_TUTORS_BUTTON_SELECTOR);
const downloadTutorCoursesListButton = document.querySelector(DOWNLOAD_TUTORS_COURSES_LIST_BUTTON_SELECTOR);
const downloadTutorHistoryButton = document.querySelector(DOWNLOAD_TUTOR_HISTORY_BUTTON_SELECTOR);

const cancellationReportButton = document.querySelector(CANCELLATION_REPORT_BUTTON_SELECTOR);

const settingsButton = document.querySelector(SETTINGS_BUTTON_SELECTOR);


hoursWorkedReportButton.onclick = () => {
  fetch('/options/hours')
    .then(res => res.text())
    .then(hoursOptionsHTML => renderOptions(hoursOptionsHTML, hoursOptions.setup))
    .catch(alert);
};

createSetmoreSlotBlockersButton.onclick = () => {
  fetch('/options/blockers')
    .then(res => res.text())
    .then(historyOptionsHTML => renderOptions(historyOptionsHTML, blockersOptions.setup))
    .catch(alert);
};

updateTutorsButton.onclick = () => {
  fetch('/tutors/update', {
    method: 'POST'
  })
    .then(res => res.json())
    // eslint-disable-next-line no-alert
    .then(() => alert('Tutors updated!'))
    .catch(alert);
};

downloadTutorCoursesListButton.onclick = () => {
  fetch('/tutors/courses-list', {
    method: 'GET'
  })
    .then(res => res.json())
    .then(tutors => tutors.map(tutor => (
      `${tutor.name}\n`
      + `Classes: ${tutor.services.join(', ')}`
    )))
    .then(tutors => tutors.join('\n\n'))
    .then(tutors => download(`tutors courses list - ${formatDate(new Date(), '-')}.txt`, tutors))
    .catch(alert);
};

downloadTutorHistoryButton.onclick = () => {
  fetch('/options/history')
    .then(res => res.text())
    .then(historyOptionsHTML => renderOptions(historyOptionsHTML, historyOptions.setup))
    .catch(alert);
};

cancellationReportButton.onclick = () => {
  fetch('/options/cancellations')
    .then(res => res.text())
    .then(cancellationsOptionsHTML => (
      renderOptions(cancellationsOptionsHTML, cancellationsOptions.setup)
    ))
    .catch(alert);
};

settingsButton.onclick = () => {
  fetch('/options/settings')
    .then(res => res.text())
    .then(settingsHTML => renderOptions(settingsHTML, settings.setup))
    .catch(alert);
};

let optionsOpen = 0;

function renderOptions(html, setup, force) {
  if (!force && optionsOpen) return;

  optionsOpen += 1;

  const optionsOuterContainer = document.createElement('div');
  optionsOuterContainer.className = OPTIONS_OUTER_CONTAINER_CLASS_NAME;

  const optionsInnerContainer = document.createElement('div');
  optionsInnerContainer.className = OPTIONS_INNER_CONTAINER_CLASS_NAME;

  const exitButton = document.createElement('span');
  exitButton.className = EXIT_BUTTON_CLASS_NAME;
  exitButton.innerText = 'X';
  exitButton.onclick = () => {
    document.body.removeChild(optionsOuterContainer);
    optionsOpen -= 1;
  };

  const optionsDiv = document.createElement('div');
  optionsDiv.className = OPTIONS_CLASS_NAME;
  optionsDiv.innerHTML = html;

  optionsInnerContainer.appendChild(exitButton);
  optionsInnerContainer.appendChild(optionsDiv);
  optionsOuterContainer.appendChild(optionsInnerContainer);
  document.body.appendChild(optionsOuterContainer);

  if (setup) setup();
}

export default {
  renderOptions
};
