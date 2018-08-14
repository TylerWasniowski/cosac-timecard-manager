var express = require('express');
var moment = require('moment');

var config = require('../config');

var setmore = require('../lib/setmore-requests');

var router = express.Router();

router.post('/create', async function(req, res, next) {
    req
        .body
        .tutors
        .forEach((staffId) => {
            req
                .body
                .dates
                .forEach((date) => {
                    var startDateTimeObj = moment(
                        date + req.body.timeStart,
                        config.dateFormat + config.timeFormat
                    );
                    var endDateTimeObj = moment(
                        date + req.body.timeEnd,
                        config.dateFormat + config.timeFormat
                    );

                    setmore.createSlotBlocker(staffId, startDateTimeObj, endDateTimeObj, req.body.description);
                });
        });

    res.send('Sent requests');
});

module.exports = router;