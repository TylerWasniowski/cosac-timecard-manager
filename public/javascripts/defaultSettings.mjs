const EMAIL_SUBJECT = 'Hours for this Pay Period';

const EMAIL_BODY_FORMAT = `Hi {name},

Your hours for this pay period are listed below. Let me know if there are any mistakes.

{hours}

Please submit them before the 29th.

Thanks!
Kris`;

export default {
  EMAIL_SUBJECT,
  EMAIL_BODY_FORMAT
};
