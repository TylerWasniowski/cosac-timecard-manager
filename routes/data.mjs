/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
import express from 'express';

import moment from 'moment';

import calculations from '../lib/calculations';
import setmore from '../lib/setmore-requests';


const {
  setmoreCancelledAppointmentDateTimeFormat,
  setmoreNotificationInfoFormat
} = process.env;


const router = express.Router();

router.post('/cancellations', async (req, res) => {
  const fromDateObject = moment(req.body.fromDate);
  const toDateObject = moment(req.body.toDate);

  let prevIndex = 0;
  let nextIndex = 0;
  let firstDateObject = moment();

  let allCancellations = [];
  while (fromDateObject.isBefore(firstDateObject)) {
    console.log(`Processing index: ${nextIndex}`);
    await setmore.getNotifications(nextIndex)
      .then(notifications => notifications.data)
      .then((notifications) => {
        nextIndex += notifications.length;
        if (prevIndex === nextIndex) {
          firstDateObject = moment(0);
        }

        prevIndex = nextIndex;

        return notifications;
      })
      .then((notifications) => {
        notifications.forEach((notification) => {
          const notificationAddedDateTimeObject = moment(notification.dateAdded);

          if (notificationAddedDateTimeObject.isBefore(firstDateObject)) {
            firstDateObject = notificationAddedDateTimeObject;
          }
        });

        return notifications;
      })
      .then((notifications) => {
        const cancellations = notifications
          .filter(notification => notification.changeType === 'DELETE')
          .filter(notification => notification.modelType === 'appointment')
          .map((notification) => {
            const notificationPieces = JSON
              .parse(notification.notificationInfo.value)
              .notificationText
              .replace(new RegExp(setmoreNotificationInfoFormat), '$1|||$2|||$3|||$4')
              .split('|||');

            return {
              tutee: notificationPieces[0],
              tutor: notificationPieces[3],
              cancellationDateTime: moment(notification.dateAdded).format(),
              appointmentType: notificationPieces[1],
              appointmentDateTime: moment(notificationPieces[2], setmoreCancelledAppointmentDateTimeFormat).format()
            };
          });

        return cancellations.filter(cancellation => (
          moment(cancellation.cancellationDateTime).isBetween(fromDateObject, toDateObject, null, '[]')
        ));
      })
      .then((cancellations) => {
        allCancellations = allCancellations.concat(cancellations);

        return allCancellations;
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send(err);
      });
  }

  res.send(allCancellations);
});

router.post('/history', async (req, res) => {
  const fromDateObject = moment(req.body.fromDate);
  const toDateObject = moment(req.body.toDate);

  // Get tutor objects from selected tutor ids
  const selectedTutors = req.body.tutors
    .map(setmoreId => (JSON.parse(process.env.tutors)
      .find(tutor => tutor.setmoreId === setmoreId)
    ));

  const historyPromises = selectedTutors.map(tutor => setmore
    .getAppointments(tutor.setmoreId, fromDateObject, toDateObject)
    .then(appointments => ({
      tutor,
      appointments
    }))
  );
  const history = await Promise.all(historyPromises);

  res.send(history);
});

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
