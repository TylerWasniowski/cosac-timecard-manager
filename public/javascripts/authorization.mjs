/* eslint-disable promise/always-return */
import indexSetup from './indexSetup.mjs';


function authorize() {
  fetch('/options/authorization')
    .then(res => res.text())
    .then(options => indexSetup.renderOptions(options, authorizationSetup, true))
    .catch(alert);
}

function authorizationSetup() {
  const AUTHOIRZATION_CODE_SELECTOR = '#authorizationCode';
  const SUBMIT_BUTTON_SELECTOR = '#submitButton';

  const authorizationCode = document.querySelector(AUTHOIRZATION_CODE_SELECTOR);
  const submitButton = document.querySelector(SUBMIT_BUTTON_SELECTOR);

  submitButton.onclick = () => {
    fetch('/emails/authorize', {
      method: 'POST',
      body: JSON.stringify({ code: authorizationCode.value }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 200) alert('Successfully authenticated email, please try sending emails again.');
        else throw Error('ERROR - Authorization failed');
      })
      .catch(() => alert('ERROR - Authorization failed'));
  };
}

export default authorize;
