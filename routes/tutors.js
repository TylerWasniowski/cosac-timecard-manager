var express = require('express');
var fs = require("fs");

var timeClock = require('../lib/opentimeclock-requests');
var setmore = require('../lib/setmore-requests');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/update', async function(req, res, next) {
    var timeClockData = await timeClock.getStaffInfo();
    var setmoreData = await setmore.getStaffInfo();

    var tutors = setmoreData
      .map((setmoreEntry) => {
        var name = setmoreEntry.FirstName + " " + setmoreEntry.LastName;
        var timeClockEntry = timeClockData.find((timeClockEntry) => timeClockEntry.Name == name);

        return {
          name,
          timeClockId: timeClockEntry ? timeClockEntry.ID : '',
          setmoreId: setmoreEntry.key,
          setmoreKey: setmoreEntry.F_Key
        }
      });

    fs.writeFile( "./data/tutors.json", JSON.stringify(tutors), "utf8", () => {});
    res.send(tutors);
});

module.exports = router;
