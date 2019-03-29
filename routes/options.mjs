import express from 'express';

const router = express.Router();

router.get('/hours', (req, res) => {
  res.render('hours-options', {
    tutors: JSON.parse(process.env.tutors)
  });
});

router.get('/blockers', (req, res) => {
  res.render('blockers-options', {
    tutors: JSON.parse(process.env.tutors)
  });
});

router.get('/authorization', (req, res) => {
  res.render('authorization');
});

router.get('/settings', (req, res) => {
  res.render('settings');
});

export default router;
