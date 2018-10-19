import express from 'express';
import fs from 'fs';
import openTimeClock from '../lib/open-time-clock-requests';
import setmore from '../lib/setmore-requests';
import tutors from '../data/tutors';

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.json(tutors);
});

router.get('/list', async (req, res, next) => {
  const setmoreResponse = setmore.getStaffServices();
  const setmoreData = await setmoreResponse;

  const tutorsData = tutors
    .map((tutor) => {
      const services = setmoreData
        .filter(service => service.ResourceKey.indexOf(tutor.setmoreId) !== -1)
        .map(service => service.ServiceName);

      return {
        name: tutor.name,
        services
      };
    });

  res.json(tutorsData);
});

router.post('/update', async (req, res, next) => {
  const openTimeClockResponse = openTimeClock.getStaffInfo();
  const setmoreResponse = setmore.getStaffInfo();

  const openTimeClockData = await openTimeClockResponse;
  const setmoreData = await setmoreResponse;

  const tutors = setmoreData
    .map((setmoreEntry) => {
      const name = `${setmoreEntry.FirstName} ${setmoreEntry.LastName}`;
      const openTimeClockEntry = openTimeClockData.find(openTimeClockEntry => openTimeClockEntry.Name === name);

      return {
        name,
        openTimeClockId: openTimeClockEntry ? openTimeClockEntry.ID : '',
        setmoreId: setmoreEntry.key
      };
    });

  fs.writeFile('./data/tutors.json', JSON.stringify(tutors), 'utf8', () => {});
  res.json(tutors);
});

export default router;
