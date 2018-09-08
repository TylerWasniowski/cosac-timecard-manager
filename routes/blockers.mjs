import express from 'express';
import moment from 'moment';
import setmore from '../lib/setmore-requests';

const { dateFormat, timeFormat } = process.env;
const router = express.Router();

router.post('/create', async (req, res) => {
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
            dateFormat + timeFormat
          );
          const endDateTimeObj = moment(
            date + req.body.timeEnd,
            dateFormat + timeFormat
          );
          setmore.createSlotBlocker(
            staffId,
            startDateTimeObj,
            endDateTimeObj,
            req.body.description
          );
        });
    });

  res.send('Sent requests');
});

export default router;
