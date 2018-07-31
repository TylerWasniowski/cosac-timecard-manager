var express = require('express');
var fs = require("fs");

var openTimeClock = require('../lib/openopenTimeClock-requests');
var setmore = require('../lib/setmore-requests');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/update', async function(req, res, next) {
    var openTimeClockResponse = openTimeClock.getStaffInfo();
    var setmoreResponse = setmore.getStaffInfo();

    var openTimeClockData = await openTimeClockResponse;
    var setmoreData = await setmoreResponse;

    var tutors = setmoreData
      .map((setmoreEntry) => {
        var name = setmoreEntry.FirstName + " " + setmoreEntry.LastName;
        var openTimeClockEntry = openTimeClockData.find((openTimeClockEntry) => openTimeClockEntry.Name == name);

        return {
          name,
          openTimeClockId: openTimeClockEntry ? openTimeClockEntry.ID : '',
          setmoreId: setmoreEntry.key
        }
      });

    fs.writeFile( "./data/tutors.json", JSON.stringify(tutors), "utf8", () => {});
    res.send(tutors);
});

module.exports = router;
