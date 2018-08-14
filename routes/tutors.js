var express = require('express');
var fs = require("fs");

var openTimeClock = require('../lib/open-time-clock-requests');
var setmore = require('../lib/setmore-requests');

var tutors = require('../data/tutors.json');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(tutors);
});

router.post('/update', async function(req, res, next) {
    const openTimeClockResponse = openTimeClock.getStaffInfo();
    const setmoreResponse = setmore.getStaffInfo();

    const openTimeClockData = await openTimeClockResponse;
    const setmoreData = await setmoreResponse;

    const tutors = setmoreData
      .map((setmoreEntry) => {
        var name = setmoreEntry.FirstName + " " + setmoreEntry.LastName;
        var openTimeClockEntry = openTimeClockData.find((openTimeClockEntry) => openTimeClockEntry.Name == name);

        return {
          name,
          openTimeClockId: openTimeClockEntry ? openTimeClockEntry.ID : '',
          setmoreId: setmoreEntry.key
        }
      });

    fs.writeFile("./data/tutors.json", JSON.stringify(tutors), "utf8", () => {});
    res.send(tutors);
});

module.exports = router;
