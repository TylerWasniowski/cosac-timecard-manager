/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
import googleapis from 'googleapis';

import open from 'open';
import replaceInFile from 'replace-in-file';


const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'
];

const { google } = googleapis;

const auth = createOAuthClient();


function sendEmails(emails) {
  return new Promise((resolve, reject) => {
    try {
      const token = JSON.parse(process.env.gmailToken);
      auth.setCredentials(token);
    } catch (err) {
      reject(Error('no token'));
      return;
    }

    const gmail = google.gmail({
      version: 'v1',
      auth
    });

    gmail.users.getProfile({
      userId: 'me'
    })
      .then(req => req.data.emailAddress)
      .then((fromEmail) => {
        const emailPromises = [];

        emails.forEach((email) => {
          const message = `From: ${fromEmail}
To: ${email.tutor.name} <${email.tutor.email}>
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0
Subject: ${email.subject}

${email.body.replace(/\n/g, '<br>')}`;

          // The body needs to be base64url encoded.
          const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          emailPromises.push(
            gmail.users.messages.send({
              userId: 'me',
              requestBody: {
                raw: encodedMessage
              }
            })
          );
        });

        return emailPromises;
      })
      .then(emailPromises => Promise.all(emailPromises)
        .then(() => resolve('emails sent'))
        .catch((err) => {
          console.log(err);
          throw err;
        })
        .catch(() => reject(Error('problem sending one or more emails'))))
      .catch(() => reject(Error('error getting profile')));
  })
    .catch((err) => {
      console.log(err);
      const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      open(authUrl);
      console.log(`opened authurl ${authUrl}`);

      throw Error('not authed');
    });
}

// Retrieved from https://developers.google.com/gmail/api/quickstart/nodejs
function authorize(code) {
  return new Promise((resolve, reject) => {
    auth.getToken(code, (err, token) => {
      if (err) return reject(Error(`error retrieving access token: ${JSON.stringify(err)}`));

      auth.setCredentials(token);

      const tokenString = JSON.stringify(token);
      process.env.gmailToken = tokenString;
      replaceInFile({
        files: '.env',
        from: /^(gmailToken\s*=.*)/gm,
        to: `gmailToken='${tokenString}'`
      });

      resolve(auth);
    });
  });
}

function createOAuthClient() {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = JSON.parse(process.env.gmailApiKey).installed;

  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

export default {
  sendEmails,
  authorize
};
