import express from 'express';
import moment from 'moment';
import config from '../config';
import setmore from '../lib/setmore-requests';

const router = express.Router();

router.post('/create', async (req, res, next) => {
  req
    .body
    .tutors
    .forEach((staffId) => {
      req
        .body
        .dates
        .forEach((date) => {
          const startDateTimeObj = moment(
            date + req.body.timeStart,
            config.dateFormat + config.timeFormat
          );
          const endDateTimeObj = moment(
            date + req.body.timeEnd,
            config.dateFormat + config.timeFormat
          );

          setmore.createSlotBlocker(staffId, startDateTimeObj, endDateTimeObj, req.body.description);
        });
    });

  res.send('Sent requests');
});

export default router;
