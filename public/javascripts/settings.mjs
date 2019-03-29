import defaultSettings from './defaultSettings.mjs';


function setup() {
  const EMAIL_SUBJECT_SELECTOR = '#emailSubject';
  const EMAIL_BODY_FORMAT_SELECTOR = '#emailBodyFormat';

  const SAVE_BUTTON_SELECTOR = '#saveButton';


  const emailSubject = document.querySelector(EMAIL_SUBJECT_SELECTOR);
  const emailBodyFormat = document.querySelector(EMAIL_BODY_FORMAT_SELECTOR);

  const saveButton = document.querySelector(SAVE_BUTTON_SELECTOR);


  emailSubject.value = getSubject();
  emailBodyFormat.value = getEmailBodyFormat();

  saveButton.onclick = () => {
    document.cookie = `subject=${encodeURIComponent(emailSubject.value)}`;
    document.cookie = `email-body-format=${encodeURIComponent(emailBodyFormat.value)}`;

    alert('Settings saved');
  };
}

function getSubject() {
  const afterReplacement = document.cookie.replace(/.*subject=(.*?)((;.*)|$)/, '$1');

  return document.cookie === afterReplacement
    ? defaultSettings.EMAIL_SUBJECT : decodeURIComponent(afterReplacement);
}

function getEmailBodyFormat() {
  const afterReplacement = document.cookie.replace(/.*email-body-format=(.*?)((;.*)|$)/, '$1');

  return document.cookie === afterReplacement
    ? defaultSettings.EMAIL_BODY_FORMAT : decodeURIComponent(afterReplacement);
}


export default {
  setup,
  getSubject,
  getEmailBodyFormat
};
