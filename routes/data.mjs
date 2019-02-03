import express from 'express';

import allTutors from '../data/tutors.json';

import calculations from '../lib/calculations';

const router = express.Router();

router.post('/hours', async (req, res) => {
  const tutors = req.body.tutors.map(setmoreId => allTutors.find(tutor => tutor.setmoreId === setmoreId));

  const hours = await calculations.getHours(
    req.query.payPeriodStart,
    req.query.payPeriodEnd,
    tutors
  );
  res.send(hours);
});

export default router;
