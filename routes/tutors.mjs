import express from 'express';
import replaceInFile from 'replace-in-file';
import openTimeClock from '../lib/open-time-clock-requests';
import setmore from '../lib/setmore-requests';


const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.json(JSON.parse(process.env.tutors));
});

router.get('/courses-list', async (req, res, next) => {
  const setmoreResponse = setmore.getStaffServices();
  const setmoreData = await setmoreResponse;

  const tutorsData = JSON.parse(process.env.tutors)
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
      const openTimeClockEntry = openTimeClockData.find(entry => entry.Name === name);

      return {
        name,
        email: setmoreEntry.LoginId,
        openTimeClockId: openTimeClockEntry ? openTimeClockEntry.ID : '',
        setmoreId: setmoreEntry.key
      };
    });

  const tutorsString = JSON.stringify(tutors);

  process.env.tutors = tutorsString;
  replaceInFile({
    files: '.env',
    from: /^(tutors\s*=.*)/gm,
    to: `tutors='${tutorsString}'`
  });
  res.json(tutors);
});

export default router;
