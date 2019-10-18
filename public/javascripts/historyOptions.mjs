
import { download } from './helperFunctions.mjs';

function setup() {
  const FROM_DATE_INPUT_SELECTOR = '#fromDateInput';
  const TO_DATE_INPUT_SELECTOR = '#toDateInput';
  const TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';
  const DOWNLOAD_HISTORY_BUTTON_SELECTOR = '#downloadHistoryButton';
  
  const fromDateInput = document.querySelector(FROM_DATE_INPUT_SELECTOR);
  const toDateInput = document.querySelector(TO_DATE_INPUT_SELECTOR);

  const downloadHistoryButton = document.querySelector(DOWNLOAD_HISTORY_BUTTON_SELECTOR);


  downloadHistoryButton.onclick = () => {
    fetch('/data/history', {
        method: 'POST',
        body: JSON.stringify({
          fromDate: fromDateInput.value,
          toDate: toDateInput.value,
          tutors: getCheckedTutors()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(history => history.forEach(entry => {
          download(`${entry.tutor.name} ${fromDateInput.value}-${toDateInput.value}.txt`, `${JSON.stringify(entry)}`)
        }));
  };

  function getCheckedTutors() {
    return Array.from(document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR))
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.id);
  }
}

export default { setup };