import express from 'express';

import calculations from '../lib/calculations';

const router = express.Router();


router.post('/hours', async (req, res) => {
  // Get tutor objects from selected tutor ids
  const selectedTutors = req.body.tutors
    .map(setmoreId => (JSON.parse(process.env.tutors)
      .find(tutor => tutor.setmoreId === setmoreId)
    ));

  try {
    const hours = await calculations.getHours(
      req.query.payPeriodStart,
      req.query.payPeriodEnd,
      selectedTutors
    );
    res.send(hours);
  } catch (err) {
    res.sendStatus(500);
  }
});

export default router;
