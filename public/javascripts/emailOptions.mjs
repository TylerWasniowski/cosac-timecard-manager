/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
import defaultSettings from './defaultSettings.mjs';

import authorize from './authorization.mjs';

async function setup(tutorsPromise) {
  const HOURS_OPTIONS_DIV_SELECTOR = '#hoursOptions';
  const EMAILS_OPTIONS_DIV_SELECTOR = '#emailsOptions';

  const LOADING_IMG_SELECTOR = '#loadingImage';

  const NAME_HEADING_SELECTOR = '#name';

  const PREVIEW_DIV_SELECTOR = '#preview';
  const PREVIEW_SUBJECT_TEXTBOX_SELECTOR = '#previewSubject';
  const PREVIEW_BODY_TEXTBOX_SELECTOR = '#previewBody';

  const NAVIGATION_BUTTONS_DIV_SELECTOR = '#navigationButtons';
  const PREVIOUS_BUTTON_SELECTOR = '.previousButton';
  const NEXT_BUTTON_SELECTOR = '.nextButton';

  const CANCEL_BUTTON_SELECTOR = '#cancelButton';
  const SEND_BUTTON_SELECTOR = '#sendButton';


  const hoursOptionsDiv = document.querySelector(HOURS_OPTIONS_DIV_SELECTOR);
  const emailOptionsDiv = document.querySelector(EMAILS_OPTIONS_DIV_SELECTOR);

  const loadingImg = document.querySelector(LOADING_IMG_SELECTOR);

  const nameHeading = document.querySelector(NAME_HEADING_SELECTOR);

  const previewDiv = document.querySelector(PREVIEW_DIV_SELECTOR);
  const previewSubjectTextbox = previewDiv.querySelector(PREVIEW_SUBJECT_TEXTBOX_SELECTOR);
  const previewBodyTextbox = previewDiv.querySelector(PREVIEW_BODY_TEXTBOX_SELECTOR);

  const navigationButtonsDiv = document.querySelector(NAVIGATION_BUTTONS_DIV_SELECTOR);
  const previousButton = navigationButtonsDiv.querySelector(PREVIOUS_BUTTON_SELECTOR);
  const nextButton = navigationButtonsDiv.querySelector(NEXT_BUTTON_SELECTOR);

  const cancelButton = document.querySelector(CANCEL_BUTTON_SELECTOR);
  const sendButton = document.querySelector(SEND_BUTTON_SELECTOR);


  let emails = [];
  let i = 0;

  setEmailOptionsHidden(false);

  cancelButton.onclick = () => {
    setLoadingHidden(false);
    setEmailOptionsHidden(true);
  };

  sendButton.onclick = () => {
    fetch('/emails/send', {
      method: 'POST',
      body: JSON.stringify({ emails }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 200) alert('Emails sent.');
        else authorize();
      })
      .catch(err => alert('ERROR - Sending emails failed. Please try again. See console for more info.') && console.log(err));
  };

  previousButton.onclick = () => {
    i = Math.max(0, i - 1);

    fillEmailPreivew();
    ensureNavigationDisplay();
  };

  nextButton.onclick = () => {
    i = Math.min(emails.length - 1, i + 1);

    fillEmailPreivew();
    ensureNavigationDisplay();
  };

  previewSubjectTextbox.oninput = () => {
    emails[i].subject = previewSubjectTextbox.value;
  };

  previewBodyTextbox.oninput = () => {
    emails[i].body = previewBodyTextbox.value;
  };

  const tutors = await tutorsPromise;
  if (!tutors.length) {
    alert('ERROR - No hours received.');
    cancelButton.onclick();
    return;
  }

  emails = tutors.map(tutor => ({
    tutor: {
      email: tutor.email,
      name: tutor.name
    },
    subject: defaultSettings.EMAIL_SUBJECT,
    body: formatEmailBody(tutor)
  }));

  fillEmailPreivew();
  ensureNavigationDisplay();

  setLoadingHidden(true);


  function fillEmailPreivew() {
    nameHeading.innerHTML = `${emails[i].tutor.name} - ${emails[i].tutor.email}`;
    previewSubjectTextbox.value = emails[i].subject;
    previewBodyTextbox.value = emails[i].body;
  }

  function formatEmailBody(tutor) {
    return defaultSettings.EMAIL_BODY_FORMAT
      .replace(/{name}/i, tutor.name.replace(/ .*/, ''))
      .replace(/{hours}/i, tutor.hours);
  }

  function ensureNavigationDisplay() {
    previousButton.toggleAttribute('hidden', i <= 0);
    nextButton.toggleAttribute('hidden', i >= emails.length - 1);
  }

  function setEmailOptionsHidden(bool) {
    hoursOptionsDiv.toggleAttribute('hidden', !bool);
    emailOptionsDiv.toggleAttribute('hidden', bool);
  }

  function setLoadingHidden(bool) {
    navigationButtonsDiv.toggleAttribute('hidden', !bool);
    sendButton.toggleAttribute('hidden', !bool);
    nameHeading.toggleAttribute('hidden', !bool);
    previewDiv.toggleAttribute('hidden', !bool);
    loadingImg.toggleAttribute('hidden', bool);
  }
}

export default {
  setup
};
