import express from 'express';
import tutors from '../data/tutors.json';

const router = express.Router();

router.get('/hours', (req, res, next) => {
  res.render('hours-options', {
    tutors
  });
});

router.get('/blockers', (req, res, next) => {
  res.render('blockers-options', {
    tutors
  });
});

export default router;
