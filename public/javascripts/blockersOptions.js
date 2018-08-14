let TIME_START_SELECTOR = '#timeStart';
let TIME_END_SELECTOR = '#timeEnd';
let DESCRIPTION_SELECTOR = '#description';
let DATES_CONTAINER_SELECTOR = '.dates';
let DATE_SELECTOR = DATES_CONTAINER_SELECTOR + ' input[type=\'date\']';
let TUTOR_CHECKBOX_SELECTOR = '.tutors input[type=\'checkbox\']';
let CREATE_SLOT_BLOCKERS_BUTTON_SELECTOR = '#createSlotBlockersButton';

let datesContainer = document.querySelector(DATES_CONTAINER_SELECTOR);
let firstDateInput = document.querySelector(DATE_SELECTOR);
let createSlotBlockersButton = document.querySelector(CREATE_SLOT_BLOCKERS_BUTTON_SELECTOR);

firstDateInput.onchange = () => {
    addDateInput();
    firstDateInput.onchange = () => {};
};

createSlotBlockersButton.onclick = () => {
    fetch('/blockers/create', {
        method: 'POST',
        body: JSON.stringify({
            timeStart: document.querySelector(TIME_START_SELECTOR).value,
            timeEnd: document.querySelector(TIME_END_SELECTOR).value,
            description: document.querySelector(DESCRIPTION_SELECTOR).value,
            dates: getSelectedDates(),
            tutors: getCheckedTutors()
        }),
        headers:{
            'Content-Type': 'application/json'
        }
    });
}

function addDateInput() {

    datesContainer.appendChild(document.createElement('br'));

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.onchange = () => {
        addDateInput();
        dateInput.onchange = () => {};
    };
    datesContainer.appendChild(dateInput);
}

function getSelectedDates() {
    return Array.from(document.querySelectorAll(DATE_SELECTOR))
        .filter((date) => date.value)
        .map((date) => date.value);
}

function getCheckedTutors() {
    return Array.from(document.querySelectorAll(TUTOR_CHECKBOX_SELECTOR))
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.id);
}