import express from 'express';
import tutors from '../data/tutors.json';

const router = express.Router();

router.get('/hours', (req, res) => {
  res.render('hours-options', {
    tutors
  });
});

router.get('/blockers', (req, res) => {
  res.render('blockers-options', {
    tutors
  });
});

export default router;
