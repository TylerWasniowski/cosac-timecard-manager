/* eslint-disable no-param-reassign */
import {
  download,
  formatUTCDate
} from './helperFunctions.mjs';

function setup() {
  const FROM_DATE_INPUT_SELECTOR = '#fromDateInput';
  const TO_DATE_INPUT_SELECTOR = '#toDateInput';

  const REQUEST_CANCELLATIONS_BUTTON_SELECTOR = '#requestCancellationsButton';


  const fromDateInput = document.querySelector(FROM_DATE_INPUT_SELECTOR);
  const toDateInput = document.querySelector(TO_DATE_INPUT_SELECTOR);

  const requestCancellationsButton = document.querySelector(REQUEST_CANCELLATIONS_BUTTON_SELECTOR);


  requestCancellationsButton.onclick = () => {
    fetch('/data/cancellations', {
      method: 'POST',
      body: JSON.stringify({
        fromDate: fromDateInput.value,
        toDate: toDateInput.value
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(allCancellations => allCancellations.filter(cancellation => cancellation))
      .then(allCancellations => allCancellations.reduce((tuteeToCancellations, cancellation) => {
        const cancellationDateTimeObject = new Date(cancellation.cancellationDateTime);
        const appointmentDateTimeObject = new Date(cancellation.appointmentDateTime);

        const hoursBeforeAppointment = (appointmentDateTimeObject - cancellationDateTimeObject) / (1000 * 60 * 60);

        if (hoursBeforeAppointment > 24) return tuteeToCancellations;

        const hoursBeforeAppointmentRounded = Math.round(hoursBeforeAppointment * 10) / 10;

        const cancellationFormatted = `${cancellation.appointmentType
        } with ${cancellation.tutor
        } on ${formatUTCDate(appointmentDateTimeObject, '/')
        } cancelled ${hoursBeforeAppointmentRounded
        } hour${hoursBeforeAppointmentRounded === 1 ? '' : 's'} before.`;

        const cancellations = tuteeToCancellations[cancellation.tutee];
        if (cancellations) {
          cancellations.push(cancellationFormatted);
        } else {
          tuteeToCancellations[cancellation.tutee] = [cancellationFormatted];
        }

        return tuteeToCancellations;
      }, {}))
      .then((tuteeToCancellations) => {
        const cancellations = [];

        Object
          .keys(tuteeToCancellations)
          .forEach(tutee => cancellations.push({
            cancellations: tuteeToCancellations[tutee].length,
            string: `${tutee
            } cancelled ${tuteeToCancellations[tutee].length
            } appointments less than 24 hours before their start (listed below).\n${tuteeToCancellations[tutee].join('\n')}`
          }));

        return cancellations
          .sort((a, b) => b.cancellations - a.cancellations)
          .map(tuteeCancellations => tuteeCancellations.string)
          .join('\n\n');
      })
      .then(cancellations => download(`cancellations - ${formatUTCDate(new Date(fromDateInput.value), '-')
      }_${formatUTCDate(new Date(toDateInput.value), '-')
      }.txt`, cancellations))
      .catch(alert);
  };
}

export default {
  setup
};
