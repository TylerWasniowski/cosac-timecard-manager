import express from 'express';

const router = express.Router();

router.get('/authorization', (req, res) => {
  res.render('authorization');
});

router.get('/history', (req, res) => {
  res.render('history-options', {
    tutors: JSON.parse(process.env.tutors)
  });
});

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

router.get('/cancellations', (req, res) => {
  res.render('cancellations-options');
});


router.get('/settings', (req, res) => {
  res.render('settings');
});

export default router;
