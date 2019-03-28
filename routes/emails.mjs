import express from 'express';

import gmailRequests from '../lib/gmail-requests';


const router = express.Router();

router.post('/send', (req, res) => {
  gmailRequests.sendEmails(req.body.emails)
    .then(() => res.sendStatus(200))
    .catch(() => res.sendStatus(401));
});

router.post('/authorize', (req, res) => {
  gmailRequests.authorize(req.body.code)
    .then(() => res.sendStatus(200))
    .catch(() => res.sendStatus(500));
});

export default router;
